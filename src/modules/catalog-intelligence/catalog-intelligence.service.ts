import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { classifyProductBrain } from "../product-brain/product-brain.classifier.js";
import { ProductBrainRepository } from "../product-brain/product-brain.repository.js";
import type { SmartCatalogService } from "../smart-catalog/smart-catalog.service.js";
import { ProductBrainStudioService } from "./product-brain-studio.service.js";
import type { ProductBrainCorrection } from "./product-brain-studio.types.js";

function arr(value: unknown): string[] { return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function sourceFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id), providerKey: String(row.provider_key ?? "unknown"), name: String(row.name ?? "Producto sin nombre"),
    ...(typeof row.description === "string" ? { description: row.description } : {}),
    ...(typeof row.short_description === "string" ? { shortDescription: row.short_description } : {}),
    categories: Object.freeze(arr(row.categories)), tags: Object.freeze(arr(row.tags)),
    ...(typeof row.material === "string" ? { material: row.material } : {}),
    customizable: row.customizable === true, attributes: rec(row.attributes), metadata: rec(row.metadata),
  };
}

export class CatalogIntelligenceService {
  private readonly brainRepository: ProductBrainRepository;
  private readonly studioService: ProductBrainStudioService;
  constructor(private readonly smartCatalog: SmartCatalogService, private readonly pool: Pool = canonicalPool()) {
    this.brainRepository = new ProductBrainRepository(pool);
    this.studioService = new ProductBrainStudioService(pool);
  }

  async stats() {
    await this.brainRepository.ensureSchema();
    const products = await this.pool.query(`SELECT count(*)::int total, count(*) FILTER (WHERE provider_key='makito')::int makito FROM canonical_products WHERE status='ACTIVE'`);
    return { products: products.rows[0] ?? { total: 0, makito: 0 }, brains: await this.brainRepository.stats() };
  }

  async list(input: { q?: string; provider?: string; status?: string; objectType?: string; interest?: string; limit?: number; offset?: number }) {
    await this.brainRepository.ensureSchema();
    const values: unknown[] = [];
    const where = ["p.status='ACTIVE'"];
    if (input.q) { values.push(`%${input.q}%`); where.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length} OR coalesce(p.description,'') ILIKE $${values.length})`); }
    if (input.provider) { values.push(input.provider); where.push(`p.provider_key=$${values.length}`); }
    if (input.status) { values.push(input.status); where.push(`b.status=$${values.length}`); }
    if (input.objectType) { values.push(input.objectType); where.push(`b.brain->>'objectType'=$${values.length}`); }
    if (input.interest) { values.push(input.interest); where.push(`b.brain @> jsonb_build_object('interests', jsonb_build_array(jsonb_build_object('id',$${values.length}::text)))`); }
    const limit = Math.max(1, Math.min(input.limit ?? 50, 200)); const offset = Math.max(0, input.offset ?? 0);
    values.push(limit, offset);
    const result = await this.pool.query(`SELECT p.id,p.sku,p.name,p.provider_key,p.description,p.categories,p.tags,p.material,p.customizable,p.updated_at,
      COALESCE((SELECT json_agg(m ORDER BY m.is_primary DESC, m.position ASC) FROM canonical_media m WHERE m.product_id=p.id AND m.type='IMAGE'),'[]'::json) media,
      b.status brain_status,b.version brain_version,b.brain,b.generated_at,b.updated_at brain_updated_at,
      count(*) OVER()::int total_count
      FROM canonical_products p LEFT JOIN canonical_product_brains b ON b.product_id=p.id
      WHERE ${where.join(" AND ")} ORDER BY p.updated_at DESC LIMIT $${values.length-1} OFFSET $${values.length}`, values);
    return { total: result.rows[0]?.total_count ?? 0, items: result.rows.map(({ total_count, ...row }) => row) };
  }

  async get(productId: string) {
    await this.brainRepository.ensureSchema();
    const result = await this.pool.query(`SELECT p.*,
      COALESCE((SELECT json_agg(m ORDER BY m.is_primary DESC, m.position ASC) FROM canonical_media m WHERE m.product_id=p.id AND m.type='IMAGE'),'[]'::json) media,
      b.status brain_status,b.version brain_version,b.brain,b.generated_at,b.updated_at brain_updated_at
      FROM canonical_products p LEFT JOIN canonical_product_brains b ON b.product_id=p.id WHERE p.id=$1`, [productId]);
    return result.rows[0];
  }

  async reclassify(productId: string) { return this.studioService.reclassify(productId); }
  async studio(productId: string) { return this.studioService.studio(productId); }
  async preview(productId: string, correction: ProductBrainCorrection) { return this.studioService.preview(productId, correction); }
  async teach(productId: string, correction: ProductBrainCorrection, actor?: string) { return this.studioService.teach(productId, correction, actor); }
  async revert(productId: string, historyId: string, actor?: string) { return this.studioService.revert(productId, historyId, actor); }

  async diagnose(input: { interests?: string[]; budget?: number; age?: number; limit?: number }) {
    const recommendations = await this.smartCatalog.recommend({ interests: input.interests, budget: input.budget, recipientAge: input.age }, input.limit ?? 20);
    return { query: input, recommendations };
  }
}
