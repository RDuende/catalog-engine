import type { ImportAdapter, NormalizedProduct, RawImportRecord } from "../import.types.js";
import { asBoolean, asNumber, asString, asStringArray, extensionOf, pick } from "../import.utils.js";
import { csvAdapter } from "./csv.adapter.js";
import { jsonAdapter } from "./json.adapter.js";

function normalizeMakito(record: RawImportRecord): NormalizedProduct | null {
  const reference = asString(pick(record, "reference", "referencia", "ref", "codigo", "código", "sku"));
  const name = asString(pick(record, "name", "nombre", "product_name", "descripcion_corta"));
  if (!reference || !name) return null;

  const imageUrls = asStringArray(pick(record, "images", "imagenes", "image_urls", "fotos"));
  const mainImage = asString(pick(record, "image", "imagen", "image_url", "foto"));
  if (mainImage && !imageUrls.includes(mainImage)) imageUrls.unshift(mainImage);

  return {
    externalId: reference,
    sku: reference,
    supplierReference: reference,
    name,
    shortDescription: asString(pick(record, "short_description", "descripcion_corta", "resumen")),
    description: asString(pick(record, "description", "descripcion", "descripción")),
    productType: asString(pick(record, "family", "familia", "tipo")),
    primaryColor: asString(pick(record, "color", "primary_color")),
    material: asString(pick(record, "material", "materiales")),
    weightGrams: asNumber(pick(record, "weight_grams", "peso_g", "peso")),
    widthMm: asNumber(pick(record, "width_mm", "ancho_mm", "ancho")),
    heightMm: asNumber(pick(record, "height_mm", "alto_mm", "alto")),
    depthMm: asNumber(pick(record, "depth_mm", "fondo_mm", "fondo")),
    customizable: asBoolean(pick(record, "customizable", "personalizable")) ?? true,
    categories: asStringArray(pick(record, "categories", "category", "familia", "subfamilia", "categoria")),
    media: imageUrls.map((url, position) => ({ url, type: "IMAGE", position, isPrimary: position === 0, altText: name })),
    metadata: {
      provider: "makito",
      raw: record,
      markingTechniques: asStringArray(pick(record, "marking", "tecnicas_marcaje", "técnicas_marcaje", "marcaje")),
      colors: asStringArray(pick(record, "colors", "colores"))
    }
  };
}

export const makitoAdapter: ImportAdapter = {
  key: "makito",
  name: "Makito",

  supports(filePath, configuration) {
    if (configuration?.provider === "makito") return true;
    return [".csv", ".tsv", ".json", ".jsonl", ".ndjson"].includes(extensionOf(filePath));
  },

  read(context) {
    return [".csv", ".tsv"].includes(extensionOf(context.filePath))
      ? csvAdapter.read(context)
      : jsonAdapter.read(context);
  },

  normalize(record) {
    return normalizeMakito(record);
  }
};
