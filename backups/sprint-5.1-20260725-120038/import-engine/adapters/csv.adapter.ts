import { readFile } from "node:fs/promises";
import type {
  ImportAdapter,
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

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeCsv(record: RawImportRecord): NormalizedProduct | null {
  const name = asString(pick(record, "name", "nombre", "title", "product_name"));
  const sku = asString(pick(record, "sku", "codigo", "código", "reference", "referencia"));
  const externalId = asString(pick(record, "external_id", "externalId", "id", "referencia", "reference", "sku"));
  if (!name || !externalId) return null;

  const images = asStringArray(pick(record, "images", "imagenes", "image_urls"));
  const image = asString(pick(record, "image", "imagen", "image_url"));
  if (image && !images.includes(image)) images.unshift(image);

  return {
    externalId,
    sku,
    supplierReference: asString(pick(record, "supplier_reference", "reference", "referencia")),
    name,
    shortDescription: asString(pick(record, "short_description", "resumen")),
    description: asString(pick(record, "description", "descripcion", "descripción")),
    productType: asString(pick(record, "product_type", "tipo")),
    primaryColor: asString(pick(record, "primary_color", "color")),
    material: asString(pick(record, "material", "materiales")),
    weightGrams: asNumber(pick(record, "weight_grams", "peso_g")),
    widthMm: asNumber(pick(record, "width_mm", "ancho_mm")),
    heightMm: asNumber(pick(record, "height_mm", "alto_mm")),
    depthMm: asNumber(pick(record, "depth_mm", "fondo_mm")),
    customizable: asBoolean(pick(record, "customizable", "personalizable")) ?? false,
    categories: asStringArray(pick(record, "categories", "category", "categorias", "categoria")),
    media: images.map((url, position) => ({ url, type: "IMAGE", position, isPrimary: position === 0, altText: name })),
    metadata: { sourceRecord: record }
  };
}

export const csvAdapter: ImportAdapter = {
  key: "generic-csv",
  name: "CSV genérico",

  supports(filePath) {
    return [".csv", ".tsv"].includes(extensionOf(filePath));
  },

  async *read(context) {
    const content = (await readFile(context.filePath, "utf8")).replace(/^\uFEFF/, "");
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return;

    const firstLine = lines.at(0);
    if (!firstLine) {
      throw new Error("El archivo CSV está vacío.");
    }

    const delimiter = extensionOf(context.filePath) === ".tsv"
      ? "\t"
      : (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
        ? ";"
        : ",";

    const headers = parseCsvLine(firstLine, delimiter).map((header) => header.trim());
    for (const line of lines.slice(1)) {
      const values = parseCsvLine(line, delimiter);
      const record: RawImportRecord = {};
      headers.forEach((header, index) => {
        record[header] = values[index] ?? "";
      });
      yield record;
    }
  },

  normalize(record) {
    return normalizeCsv(record);
  }
};