import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import readline from "node:readline";
import type {
  ImportAdapter,
  ImportAdapterContext,
  NormalizedProduct,
  RawImportRecord
} from "../import.types.js";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  extensionOf,
  pick
} from "../import.utils.js";

function normalizeGeneric(record: RawImportRecord): NormalizedProduct | null {
  const name = asString(pick(record, "name", "nombre", "title", "product_name"));
  const sku = asString(pick(record, "sku", "codigo", "código", "reference", "referencia"));
  const externalId = asString(
    pick(record, "externalId", "external_id", "id", "supplierReference", "referencia", "reference", "sku")
  );

  if (!name || !externalId) return null;

  const images = asStringArray(pick(record, "images", "imagenes", "imágenes", "image_urls"));
  const primaryImage = asString(pick(record, "image", "imagen", "image_url", "main_image"));
  if (primaryImage && !images.includes(primaryImage)) images.unshift(primaryImage);

  return {
    externalId,
    sku,
    supplierReference: asString(pick(record, "supplierReference", "supplier_reference", "reference", "referencia")),
    name,
    slug: asString(record.slug),
    shortDescription: asString(pick(record, "shortDescription", "short_description", "resumen")),
    description: asString(pick(record, "description", "descripcion", "descripción")),
    productType: asString(pick(record, "productType", "product_type", "tipo")),
    primaryColor: asString(pick(record, "primaryColor", "primary_color", "color")),
    material: asString(pick(record, "material", "materials", "materiales")),
    weightGrams: asNumber(pick(record, "weightGrams", "weight_grams", "peso_g")),
    widthMm: asNumber(pick(record, "widthMm", "width_mm", "ancho_mm")),
    heightMm: asNumber(pick(record, "heightMm", "height_mm", "alto_mm")),
    depthMm: asNumber(pick(record, "depthMm", "depth_mm", "fondo_mm")),
    customizable: asBoolean(pick(record, "customizable", "personalizable")) ?? false,
    categories: asStringArray(pick(record, "categories", "category", "categorias", "categoría", "categoria")),
    media: images.map((url, position) => ({
      url,
      type: "IMAGE",
      position,
      isPrimary: position === 0,
      altText: name
    })),
    metadata: { sourceRecord: record }
  };
}

export const jsonAdapter: ImportAdapter = {
  key: "generic-json",
  name: "JSON genérico",

  supports(filePath) {
    return [".json", ".jsonl", ".ndjson"].includes(extensionOf(filePath));
  },

  async *read(context: ImportAdapterContext): AsyncIterable<RawImportRecord> {
    const extension = extensionOf(context.filePath);

    if (extension === ".jsonl" || extension === ".ndjson") {
      const input = createReadStream(context.filePath, { encoding: "utf8" });
      const lines = readline.createInterface({ input, crlfDelay: Infinity });
      for await (const line of lines) {
        const clean = line.trim();
        if (clean) yield JSON.parse(clean) as RawImportRecord;
      }
      return;
    }

    const parsed = JSON.parse(await readFile(context.filePath, "utf8")) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { products?: unknown }).products)
        ? (parsed as { products: RawImportRecord[] }).products
        : [parsed];

    for (const row of rows) {
      if (typeof row === "object" && row !== null && !Array.isArray(row)) {
        yield row as RawImportRecord;
      }
    }
  },

  normalize(record) {
    return normalizeGeneric(record);
  }
};
