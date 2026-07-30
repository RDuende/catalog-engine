import type { NormalizedMedia, NormalizedProduct, NormalizedVariant } from "../import-engine/import.types.js";
import type { ProviderAdapter, ProviderPage, ProviderRequestOptions } from "./provider-types.js";
import { asArray, asBoolean, asNumber, asString, firstValue } from "./provider-utils.js";
import { getMakitoToken, makitoFetchJson, resolveMakitoConfig, type MakitoApiConfig } from "./makito-client.js";

function objectItems(value: unknown): Record<string, unknown>[] {
  return asArray(value).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function categories(record: Record<string, unknown>): string[] {
  return asArray(record.categories).flatMap(item => {
    if (typeof item === "string") return [item];
    if (item && typeof item === "object") {
      const name = asString(firstValue(item, ["name", "description", "label", "title"]));
      return name ? [name] : [];
    }
    return [];
  });
}

function media(record: Record<string, unknown>): NormalizedMedia[] {
  const candidates = [record.image, record.images, record.photo, record.photos].flatMap(asArray);
  const urls = candidates.flatMap(item => {
    if (typeof item === "string") return [item];
    if (item && typeof item === "object") {
      const url = asString(firstValue(item, ["url", "principal", "thumbnail", "src"]));
      return url ? [url] : [];
    }
    return [];
  });
  return [...new Set(urls)].map((url, position) => ({ url, type: "IMAGE" as const, isPrimary: position === 0, position }));
}

function variants(record: Record<string, unknown>): NormalizedVariant[] {
  const source = firstValue(record, ["variants", "variant", "materials", "colors", "sizes"]);
  return objectItems(source).map((item, index) => {
    const sku = asString(firstValue(item, ["ref", "reference", "material", "sku", "id"])) ?? `${record.ref ?? "makito"}-${index + 1}`;
    const variantImage = asString(firstValue(item, ["variant_image", "image", "image_url"]));
    return {
      sku,
      name: asString(firstValue(item, ["name", "description", "label"])),
      barcode: asString(firstValue(item, ["ean", "barcode", "gtin"])),
      color: asString(firstValue(item, ["color", "colour", "color_name", "description"])),
      size: asString(firstValue(item, ["size", "talla", "size_name"])),
      metadata: { ...item, ...(variantImage ? { variantImage } : {}) }
    };
  });
}

export class MakitoProviderAdapter implements ProviderAdapter<Record<string, unknown>> {
  readonly key = "makito";
  readonly name = "Makito API B2B";
  readonly description = "Conector oficial JWT para catálogo, imágenes, stock, precios y marcaje de Makito.";

  async testConnection(config: MakitoApiConfig) {
    const started = Date.now();
    try {
      await getMakitoToken(resolveMakitoConfig(config), true);
      return { ok: true, message: "Autenticación correcta con Makito.", latencyMs: Date.now() - started };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - started };
    }
  }

  async fetchPage(config: MakitoApiConfig, options: ProviderRequestOptions = {}): Promise<ProviderPage<Record<string, unknown>>> {
    const resolved = resolveMakitoConfig(config);
    const raw = await makitoFetchJson<Record<string, unknown>>(resolved, "/catalog/files", { format: "JSON", lang: resolved.lang ?? "es" });
    const all = objectItems(firstValue(raw, ["products", "data.products", "data", "items"]));
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? (all.length || 1);
    const offset = (page - 1) * pageSize;
    const items = all.slice(offset, offset + pageSize);
    return { items, page, pageSize, total: all.length, hasMore: offset + items.length < all.length, raw };
  }

  normalize(record: Record<string, unknown>, _config: MakitoApiConfig): NormalizedProduct | null {
    const externalId = asString(record.ref);
    const name = asString(record.name);
    if (!externalId || !name) return null;
    const productMedia = media(record);
    const directImage = asString(record.image);
    if (directImage && !productMedia.some(item => item.url === directImage)) productMedia.unshift({ url: directImage, type: "IMAGE", isPrimary: true, position: 0 });
    return {
      externalId,
      sku: asString(record.web_reference) ?? externalId,
      supplierReference: externalId,
      name,
      description: asString(record.description),
      productType: asString(firstValue(record, ["product_type", "type", "family"])),
      primaryColor: asString(firstValue(record, ["color", "primary_color"])),
      material: asString(record.material),
      weightGrams: asNumber(record.weight),
      widthMm: asNumber(record.width),
      heightMm: asNumber(record.height),
      depthMm: asNumber(record.length),
      customizable: Boolean(asString(record.printcode)) || asBoolean(record.customizable),
      categories: categories(record),
      variants: variants(record),
      media: productMedia,
      metadata: {
        provider: "makito",
        webReference: record.web_reference,
        brand: record.brand,
        newProduct: record.web_new,
        customsCode: record.custom_code,
        printCode: record.printcode,
        diameter: record.diameter,
        batteries: record.batteries,
        sizes: record.sizes,
        packaging: {
          final: { type: record.pf_type, units: record.pf_units, length: record.pf_length, height: record.pf_height, width: record.pf_width, weight: record.pf_weight },
          master: { type: record.ptc_type, units: record.ptc_units, length: record.ptc_length, height: record.ptc_height, width: record.ptc_width, weight: record.ptc_weight },
          pallet: { units: record.pallet_units, bundles: record.bundle_pallets, weight: record.pallet_weight }
        },
        providerRaw: record
      }
    };
  }
}
