import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { expandInterestTerms } from "./interest-affinity.js";
import type { SmartCatalogContext, SmartCatalogProduct, SmartCatalogRepository } from "./smart-catalog.types.js";

import { resolveRuntimeProductImages } from "../catalog-media/image-runtime/index.js";
function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  if (typeof value === "string" && value.trim()) return value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function escapePostgresRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapBrain(value: unknown): SmartCatalogProduct["brain"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const brain = value as Record<string, unknown>;
  const roles = stringArray(brain.giftRoles).filter((role): role is "PRIMARY" | "COMPLEMENT" | "BUNDLE_COMPONENT" | "PROMOTIONAL" => ["PRIMARY", "COMPLEMENT", "BUNDLE_COMPONENT", "PROMOTIONAL"].includes(role));
  const interests = Array.isArray(brain.interests) ? brain.interests.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    return typeof row.id === "string" && typeof row.score === "number" ? [{ id: row.id, score: row.score }] : [];
  }) : [];
  const score = (key: string) => typeof brain[key] === "number" ? Math.max(0, Math.min(1, brain[key] as number)) : 0;
  return Object.freeze({
    objectType: text(brain.objectType) ?? "generic_object",
    giftRoles: Object.freeze(roles),
    interests: Object.freeze(interests),
    personalizationScore: score("personalizationScore"),
    bundleScore: score("bundleScore"),
    premiumScore: score("premiumScore"),
    giftSuitabilityScore: score("giftSuitabilityScore"),
    classificationConfidence: score("classificationConfidence"),
  });
}

function mediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const url = text((item as Record<string, unknown>).url);
    return url ? [url] : [];
  });
}

function mapRow(row: Record<string, unknown>): SmartCatalogProduct {
  const attributes = (row.attributes && typeof row.attributes === "object" ? row.attributes : {}) as Record<string, unknown>;
  const metadata = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const categories = stringArray(row.categories);
  const importedTags = stringArray(row.tags);
  const semanticTags = [
    ...importedTags,
    ...categories,
    ...stringArray(attributes.interests),
    ...stringArray(attributes.searchTerms),
    ...stringArray(metadata.interests),
    ...stringArray(metadata.searchTerms),
    text(row.material),
    text(row.brand),
  ].filter((item): item is string => Boolean(item));

  const importedPrice = numberValue(attributes.salePrice, attributes.price, metadata.salePrice, metadata.price);
  const priceKnown = importedPrice !== undefined && importedPrice > 0;
  const price = priceKnown ? importedPrice : 0;
  const cost = numberValue(attributes.cost, metadata.cost, price > 0 ? price * 0.55 : 0) ?? 0;
  const stock = numberValue(attributes.stock, attributes.quantity, metadata.stock, metadata.quantity, 999) ?? 999;
  const productionDays = numberValue(attributes.productionDays, metadata.productionDays, 5) ?? 5;
  const minAge = numberValue(attributes.minAge, metadata.minAge);
  const maxAge = numberValue(attributes.maxAge, metadata.maxAge);

  const rawImages = mediaUrls(row.media);
  const resolvedImages =
    resolveRuntimeProductImages({
      productId:
        String(
          row.id ??
          row.product_id ??
          row.sku ??
          "unknown-product",
        ),
      ...(typeof row.provider_key === "string"
        ? { providerKey: row.provider_key }
        : {}),
      ...(typeof row.sku === "string"
        ? { sku: row.sku }
        : {}),
      images: rawImages,
    });
  const images = resolvedImages.images;
  return Object.freeze({
    id: String(row.id),
    sku: text(row.sku) ?? text(row.external_id) ?? String(row.id),
    name: text(row.name) ?? "Producto sin nombre",
    ...(text(row.description) || text(row.short_description) ? { description: text(row.description) ?? text(row.short_description) } : {}),
    ...(text(row.provider_key) ? { providerKey: text(row.provider_key) } : {}),
    ...(images[0] ? { imageUrl: images[0], images: Object.freeze(images) } : {}),
    category: categories[0] ?? "OTHER",
    price,
    priceKnown,
    cost,
    currency: text(attributes.currency) ?? text(metadata.currency) ?? "EUR",
    stock: Math.max(0, Math.floor(stock)),
    productionDays: Math.max(0, Math.ceil(productionDays)),
    ...(minAge !== undefined ? { minAge } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
    tags: Object.freeze([...new Set(semanticTags.map(normalize))]),
    emotionalGoals: Object.freeze(stringArray(attributes.emotionalGoals ?? metadata.emotionalGoals)),
    visualStyles: Object.freeze(stringArray(attributes.visualStyles ?? metadata.visualStyles)),
    presentationTemplateIds: Object.freeze(stringArray(attributes.presentationTemplateIds ?? metadata.presentationTemplateIds)),
    active: row.status === "ACTIVE",
    ...(mapBrain(row.product_brain) ? { brain: mapBrain(row.product_brain) } : {}),
  });
}

export class CanonicalSmartCatalogRepository implements SmartCatalogRepository {
  private readonly cache = new Map<string, SmartCatalogProduct>();

  constructor(private readonly pool: Pool = canonicalPool()) {}

  async list(context: SmartCatalogContext = {}): Promise<readonly SmartCatalogProduct[]> {
    const terms = [...expandInterestTerms(context.interests)];
    const values: unknown[] = [];
    const where = ["p.status='ACTIVE'"];
    if (terms.length > 0) {
      values.push(terms.map(escapePostgresRegex));
      const i = values.length;
      where.push(`EXISTS (
        SELECT 1 FROM unnest($${i}::text[]) term
        WHERE lower(concat_ws(' ', p.name, p.description, p.short_description, p.brand, p.material, p.categories::text, p.tags::text, p.attributes::text, p.metadata::text))
          ~ ('(^|[^[:alnum:]])' || lower(term) || '([^[:alnum:]]|$)')
      )`);
    }
    values.push(500);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS canonical_product_brains (product_id uuid PRIMARY KEY REFERENCES canonical_products(id) ON DELETE CASCADE, version text NOT NULL, status text NOT NULL, brain jsonb NOT NULL, source_content_hash text, generated_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    const result = await this.pool.query(`SELECT p.*, b.brain AS product_brain,
      COALESCE((SELECT json_agg(m ORDER BY m.is_primary DESC, m.position ASC) FROM canonical_media m WHERE m.product_id=p.id AND m.type='IMAGE'),'[]'::json) media
      FROM canonical_products p LEFT JOIN canonical_product_brains b ON b.product_id=p.id WHERE ${where.join(" AND ")} ORDER BY p.updated_at DESC LIMIT $${values.length}`, values);
    const products = result.rows.map((row) => mapRow(row));
    for (const product of products) this.cache.set(product.id, product);
    return Object.freeze(products);
  }

  getById(id: string): SmartCatalogProduct | undefined {
    return this.cache.get(id);
  }
}
