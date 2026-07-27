import type { NormalizedProduct, RawImportRecord, WeightedSemanticValue } from "../import.types.js";
import { asBoolean, asNumber, asString, asStringArray, pick } from "../import.utils.js";

function semantics(value: unknown, source: WeightedSemanticValue["source"] = "supplier"): WeightedSemanticValue[] {
  return asStringArray(value).map((item) => ({ value: item, weight: 1, source }));
}

function parseVariants(value: unknown, parentSku?: string) {
  if (Array.isArray(value)) {
    return value.flatMap((raw, index) => {
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return [];
      const row = raw as RawImportRecord;
      const sku = asString(pick(row, "sku", "codigo", "código")) ?? (parentSku ? `${parentSku}-${index + 1}` : undefined);
      if (!sku) return [];
      return [{
        sku,
        name: asString(pick(row, "name", "nombre")),
        barcode: asString(pick(row, "barcode", "ean")),
        color: asString(pick(row, "color", "colour")),
        size: asString(pick(row, "size", "talla")),
        capacity: asString(pick(row, "capacity", "capacidad")),
        finish: asString(pick(row, "finish", "acabado")),
        priceAdjustment: asNumber(pick(row, "priceAdjustment", "price_adjustment", "incremento_precio")),
        stock: asNumber(pick(row, "stock", "existencias")),
        imageUrl: asString(pick(row, "image", "imageUrl", "imagen")),
        metadata: row
      }];
    });
  }

  const colors = asStringArray(value);
  return colors.map((color, index) => ({
    sku: `${parentSku ?? "VAR"}-${index + 1}`,
    name: color,
    color
  }));
}

export function normalizeGenericRecord(record: RawImportRecord): NormalizedProduct | null {
  const name = asString(pick(record, "name", "nombre", "title", "product_name", "producto"));
  const sku = asString(pick(record, "sku", "codigo", "código", "reference", "referencia", "ref"));
  const externalId = asString(pick(record, "externalId", "external_id", "id", "supplierReference", "referencia", "reference", "sku", "codigo"));
  if (!name || !externalId) return null;

  const images = asStringArray(pick(record, "images", "imagenes", "imágenes", "image_urls", "fotos"));
  const primaryImage = asString(pick(record, "image", "imagen", "image_url", "main_image", "foto"));
  if (primaryImage && !images.includes(primaryImage)) images.unshift(primaryImage);

  const rawVariants = pick(record, "variants", "variantes", "colores");
  const variants = parseVariants(rawVariants, sku);

  return {
    externalId,
    sku,
    supplierReference: asString(pick(record, "supplierReference", "supplier_reference", "reference", "referencia", "ref")),
    name,
    slug: asString(record.slug),
    shortDescription: asString(pick(record, "shortDescription", "short_description", "resumen", "descripcion_corta")),
    description: asString(pick(record, "description", "descripcion", "descripción")),
    productType: asString(pick(record, "productType", "product_type", "tipo", "familia")),
    primaryColor: asString(pick(record, "primaryColor", "primary_color", "color")),
    material: asString(pick(record, "material", "materials", "materiales")),
    weightGrams: asNumber(pick(record, "weightGrams", "weight_grams", "peso_g", "peso")),
    widthMm: asNumber(pick(record, "widthMm", "width_mm", "ancho_mm", "ancho")),
    heightMm: asNumber(pick(record, "heightMm", "height_mm", "alto_mm", "alto")),
    depthMm: asNumber(pick(record, "depthMm", "depth_mm", "fondo_mm", "fondo")),
    customizable: asBoolean(pick(record, "customizable", "personalizable")) ?? false,
    categories: asStringArray(pick(record, "categories", "category", "categorias", "categoría", "categoria", "familia", "subfamilia")),
    media: images.map((url, position) => ({ url, type: "IMAGE", position, isPrimary: position === 0, altText: name })),
    variants,
    tags: semantics(pick(record, "tags", "etiquetas")),
    audiences: semantics(pick(record, "audiences", "audience", "destinatarios", "destinatario")),
    occasions: semantics(pick(record, "occasions", "occasion", "ocasiones", "ocasion")),
    emotions: semantics(pick(record, "emotions", "emotion", "emociones", "emocion")),
    professions: semantics(pick(record, "professions", "profession", "profesiones", "profesion")),
    interests: semantics(pick(record, "interests", "interest", "intereses", "aficiones", "aficion")),
    styles: semantics(pick(record, "styles", "style", "estilos", "estilo")),
    values: semantics(pick(record, "values", "valores")),
    useCases: semantics(pick(record, "useCases", "use_cases", "usos", "casos_uso")),
    personalizationMethods: asStringArray(pick(record, "personalizationMethods", "personalization_methods", "marcaje", "tecnicas_marcaje")),
    metadata: { sourceRecord: record }
  };
}
