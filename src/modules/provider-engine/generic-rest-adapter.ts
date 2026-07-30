import type { NormalizedMedia, NormalizedProduct, NormalizedVariant } from "../import-engine/import.types.js";
import { providerFetch } from "./http-provider-client.js";
import type { ProviderAdapter, ProviderConnectionConfig, ProviderPage, ProviderRequestOptions } from "./provider-types.js";
import { asArray, asBoolean, asNumber, asString, firstValue, getByPath, joinUrl } from "./provider-utils.js";

function mapped(record: unknown, config: ProviderConnectionConfig, key: string, defaults: string[]): unknown {
  const custom = config.fieldMap?.[key];
  return firstValue(record, custom ? [custom, ...defaults] : defaults);
}

function mediaFrom(record: unknown, config: ProviderConnectionConfig): NormalizedMedia[] {
  const value = mapped(record, config, "media", ["images", "media", "photos", "imagenes"]);
  const media: NormalizedMedia[] = [];

  for (const [index, item] of asArray(value).entries()) {
    if (typeof item === "string") {
      media.push({
        url: item,
        type: "IMAGE",
        isPrimary: index === 0,
        position: index
      });
      continue;
    }

    const url = asString(firstValue(item, ["url", "src", "large", "original", "imageUrl"]));
    if (!url) continue;

    media.push({
      url,
      type: "IMAGE",
      altText: asString(firstValue(item, ["alt", "altText", "title"])),
      isPrimary: asBoolean(firstValue(item, ["primary", "isPrimary"])) ?? index === 0,
      position: asNumber(firstValue(item, ["position", "order"])) ?? index,
      metadata: typeof item === "object" && item !== null
        ? item as Record<string, unknown>
        : undefined
    });
  }

  return media;
}

function variantsFrom(record: unknown, config: ProviderConnectionConfig): NormalizedVariant[] {
  const value = mapped(record, config, "variants", ["variants", "combinations", "colors", "variantes"]);
  const variants: NormalizedVariant[] = [];

  for (const [index, item] of asArray(value).entries()) {
    if (!item || typeof item !== "object") continue;

    const sku = asString(firstValue(item, ["sku", "reference", "ref", "code", "id"]))
      ?? `variant-${index + 1}`;

    variants.push({
      sku,
      name: asString(firstValue(item, ["name", "title", "description"])),
      barcode: asString(firstValue(item, ["barcode", "ean", "gtin"])),
      color: asString(firstValue(item, ["color.name", "color", "colour"])),
      size: asString(firstValue(item, ["size.name", "size", "talla"])),
      metadata: item as Record<string, unknown>
    });
  }

  return variants;
}

export class GenericRestProviderAdapter implements ProviderAdapter<Record<string, unknown>> {
  readonly key: string = "generic-rest";
  readonly name: string = "API REST genérica";
  readonly description: string = "Conector configurable para APIs JSON paginadas.";

  async testConnection(config: ProviderConnectionConfig) {
    const started = Date.now();
    try {
      await this.fetchPage(config, { page: 1, pageSize: 1 });
      return { ok: true, message: "Conexión correcta.", latencyMs: Date.now() - started };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - started };
    }
  }

  async fetchPage(config: ProviderConnectionConfig, options: ProviderRequestOptions = {}): Promise<ProviderPage<Record<string, unknown>>> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? config.pageSize ?? 100;
    const path = options.endpoint ?? config.productsPath ?? "/products";
    const url = new URL(joinUrl(config.baseUrl, path));
    url.searchParams.set(config.pageParam ?? "page", String(page));
    url.searchParams.set(config.pageSizeParam ?? "limit", String(pageSize));
    if (options.updatedSince) url.searchParams.set(config.updatedSinceParam ?? "updated_since", options.updatedSince);
    for (const [key, value] of Object.entries(options.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const raw = await providerFetch(config, url);
    const candidate = config.responseItemsPath ? getByPath(raw, config.responseItemsPath) : firstValue(raw, ["items", "products", "data.items", "data.products", "data", "results"]);
    const items = (Array.isArray(candidate) ? candidate : Array.isArray(raw) ? raw : [])
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
    const total = asNumber(config.responseTotalPath ? getByPath(raw, config.responseTotalPath) : firstValue(raw, ["total", "pagination.total", "meta.total", "data.total"]));
    return { items, page, pageSize, total, hasMore: total !== undefined ? page * pageSize < total : items.length === pageSize, raw };
  }

  async fetchProduct(config: ProviderConnectionConfig, externalId: string) {
    const path = (config.productPath ?? "/products/{id}").replace("{id}", encodeURIComponent(externalId));
    const raw = await providerFetch(config, new URL(joinUrl(config.baseUrl, path)));
    const product = firstValue(raw, ["product", "data.product", "data"]);
    const candidate = product ?? raw;
    return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as Record<string, unknown> : null;
  }

  normalize(record: Record<string, unknown>, config: ProviderConnectionConfig): NormalizedProduct | null {
    const externalId = asString(mapped(record, config, "externalId", ["id", "productId", "product_id", "reference", "ref", "code", "sku"]));
    const name = asString(mapped(record, config, "name", ["name", "title", "productName", "description.name", "nombre"]));
    if (!externalId || !name) return null;
    const categories = asArray(mapped(record, config, "categories", ["categories", "categoryPath", "category", "families"]))
      .flatMap(value => typeof value === "string" ? [value] : value && typeof value === "object" ? [asString(firstValue(value, ["name", "title", "label"]))] : [])
      .filter((value): value is string => Boolean(value));
    return {
      externalId,
      sku: asString(mapped(record, config, "sku", ["sku", "reference", "ref", "code"])),
      supplierReference: asString(mapped(record, config, "supplierReference", ["reference", "ref", "code", "sku"])),
      name,
      shortDescription: asString(mapped(record, config, "shortDescription", ["shortDescription", "summary", "description.short", "descripcion_corta"])),
      description: asString(mapped(record, config, "description", ["description", "longDescription", "description.long", "descripcion"])),
      productType: asString(mapped(record, config, "productType", ["productType", "type", "family.name", "family"])),
      primaryColor: asString(mapped(record, config, "primaryColor", ["primaryColor", "color.name", "color"])),
      material: asString(mapped(record, config, "material", ["material.name", "material", "materials.0.name", "materials.0"])),
      weightGrams: asNumber(mapped(record, config, "weightGrams", ["weightGrams", "weight_grams", "weight", "dimensions.weight"])),
      widthMm: asNumber(mapped(record, config, "widthMm", ["widthMm", "width_mm", "dimensions.width", "width"])),
      heightMm: asNumber(mapped(record, config, "heightMm", ["heightMm", "height_mm", "dimensions.height", "height"])),
      depthMm: asNumber(mapped(record, config, "depthMm", ["depthMm", "depth_mm", "dimensions.depth", "depth"])),
      customizable: asBoolean(mapped(record, config, "customizable", ["customizable", "personalizable", "printing.available"])),
      categories,
      variants: variantsFrom(record, config),
      media: mediaFrom(record, config),
      metadata: { providerRaw: record }
    };
  }
}
