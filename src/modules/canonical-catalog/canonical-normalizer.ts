import type { CanonicalMediaInput, CanonicalProductInput, CanonicalVariantInput } from "./canonical-types.js";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const result = String(value).trim();
  return result || undefined;
}
function numberValue(value: unknown): number | undefined {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : undefined;
}
function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(text).filter((item): item is string => Boolean(item)))];
}
function objectValue(value: unknown): Record<string, unknown> | undefined {
  const result = record(value);
  return Object.keys(result).length ? result : undefined;
}

function variants(value: unknown): CanonicalVariantInput[] {
  if (!Array.isArray(value)) return [];
  const result: CanonicalVariantInput[] = [];
  for (const raw of value) {
    const item = record(raw);
    const sku = text(item.sku ?? item.reference ?? item.ref ?? item.externalId);
    if (!sku) continue;
    result.push({
      externalId: text(item.externalId ?? item.id ?? item.reference ?? item.ref),
      sku,
      name: text(item.name),
      barcode: text(item.barcode ?? item.ean ?? item.gtin),
      color: text(item.color),
      size: text(item.size),
      material: text(item.material),
      active: bool(item.active),
      metadata: objectValue(item.metadata),
    });
  }
  return result;
}

function media(value: unknown): CanonicalMediaInput[] {
  if (!Array.isArray(value)) return [];
  const result: CanonicalMediaInput[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const raw = value[index];
    if (typeof raw === "string") {
      const url = text(raw);
      if (url) result.push({ url, type: "IMAGE", isPrimary: index === 0, position: index });
      continue;
    }
    const item = record(raw);
    const url = text(item.url ?? item.src ?? item.href);
    if (!url) continue;
    const rawType = text(item.type)?.toUpperCase();
    const type = rawType === "VIDEO" || rawType === "DOCUMENT" || rawType === "PDF" ? rawType : "IMAGE";
    result.push({
      url,
      type,
      altText: text(item.altText ?? item.alt),
      isPrimary: bool(item.isPrimary) ?? index === 0,
      position: numberValue(item.position) ?? index,
      metadata: objectValue(item.metadata),
    });
  }
  return result;
}

export function toCanonicalProduct(providerKey: string, raw: unknown): CanonicalProductInput {
  const item = record(raw);
  const externalId = text(item.externalId ?? item.id ?? item.ref ?? item.reference ?? item.sku);
  const name = text(item.name ?? item.title);
  if (!externalId) throw new Error("El producto no tiene externalId, id, ref, reference ni sku.");
  if (!name) throw new Error(`El producto ${externalId} no tiene nombre.`);

  const rawStatus = text(item.status)?.toUpperCase();
  const status = rawStatus === "INACTIVE" || rawStatus === "DISCONTINUED" || rawStatus === "DRAFT" ? rawStatus : "ACTIVE";

  return {
    providerKey,
    externalId,
    sku: text(item.sku ?? item.reference ?? item.ref),
    name,
    description: text(item.description),
    shortDescription: text(item.shortDescription ?? item.summary),
    brand: text(item.brand),
    material: text(item.material),
    color: text(item.color),
    dimensions: text(item.dimensions),
    weight: numberValue(item.weight),
    customizable: bool(item.customizable),
    status,
    sourceUpdatedAt: text(item.sourceUpdatedAt ?? item.updatedAt),
    categories: strings(item.categories),
    tags: strings(item.tags ?? item.keywords),
    attributes: objectValue(item.attributes),
    metadata: objectValue(item.metadata),
    variants: variants(item.variants),
    media: media(item.media ?? item.images),
  };
}
