import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { extractMakitoPrintConfigProducts } from "./makito-marking.mapper.js";
import { parseMakitoTechniqueString } from "./makito-marking-v22.js";

export type MakitoTechniqueDictionaryStatus =
  | "CONFIRMED"
  | "PROBABLE"
  | "REVIEW"
  | "UNKNOWN";

export interface MakitoTechniqueEvidence {
  readonly label: string;
  readonly count: number;
  readonly source: "CATEGORY" | "METADATA";
}

export interface MakitoTechniqueDictionaryEntry {
  readonly providerCode: string;
  readonly candidateName?: string;
  readonly confidence: number;
  readonly support: number;
  readonly labeledOccurrences: number;
  readonly totalOccurrences: number;
  readonly status: MakitoTechniqueDictionaryStatus;
  readonly recommendedForNormalization: boolean;
  readonly evidence: readonly MakitoTechniqueEvidence[];
  readonly sampleProductIds: readonly string[];
}

export interface MakitoTechniqueDictionary {
  readonly provider: "makito";
  readonly generatedAt: string;
  readonly catalogSnapshot?: string;
  readonly stats: {
    readonly codes: number;
    readonly confirmed: number;
    readonly probable: number;
    readonly review: number;
    readonly unknown: number;
  };
  readonly entries: readonly MakitoTechniqueDictionaryEntry[];
}

interface CatalogProduct {
  readonly externalId?: string;
  readonly supplierReference?: string;
  readonly sku?: string;
  readonly name?: string;
  readonly categories?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

interface Accumulator {
  totalOccurrences: number;
  labels: Map<string, { count: number; source: "CATEGORY" | "METADATA" }>;
  sampleProductIds: Set<string>;
}

const DATA_DIR = join(process.cwd(), "storage", "marking-intelligence");
const DICTIONARY_FILE = join(DATA_DIR, "makito-technique-dictionary.json");

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const CANONICAL_RULES: ReadonlyArray<readonly [RegExp, string]> = Object.freeze([
  [/\bserigraf/i, "Serigrafía"],
  [/\btampograf/i, "Tampografía"],
  [/\bsublim/i, "Sublimación"],
  [/\bdtf[\s_-]*uv\b/i, "DTF UV"],
  [/\bdtf\b/i, "DTF"],
  [/\bl[aá]ser\b.*\bfibra\b|\bfibra\b.*\bl[aá]ser\b/i, "Láser fibra"],
  [/\bl[aá]ser\b.*\bco2\b|\bco2\b.*\bl[aá]ser\b/i, "Láser CO2"],
  [/\bgrabaci[oó]n\b.*\bl[aá]ser\b|\bl[aá]ser\b/i, "Grabación láser"],
  [/\bbordad/i, "Bordado"],
  [/\btransfer\b/i, "Transfer"],
  [/\bimpresi[oó]n\b.*\buv\b|\buv\b.*\bimpresi[oó]n\b/i, "Impresión UV"],
  [/\bimpresi[oó]n\b.*\bdigital\b|\bdigital\b.*\bimpresi[oó]n\b/i, "Impresión digital"],
  [/\btermograb/i, "Termograbado"],
  [/\bdoming\b|\bresina\b/i, "Doming / resina"],
]);

export function canonicalTechniqueLabel(value: string): string | undefined {
  const clean = value
    .replace(/^.*t[eé]cnicas?\s+de\s+marcaje\s*>\s*/i, "")
    .replace(/^.*marcaje\s*>\s*/i, "")
    .trim();

  for (const [pattern, canonical] of CANONICAL_RULES) {
    if (pattern.test(clean)) return canonical;
  }

  const normalized = normalizeText(clean);
  if (!normalized || normalized === "tecnicas de marcaje") return undefined;

  // We preserve a readable provider/catalog label when it is specific enough,
  // but it will not be auto-normalized unless confidence thresholds are met.
  return clean.length >= 3 ? clean : undefined;
}

function labelsFromProduct(product: CatalogProduct): Array<{
  label: string;
  source: "CATEGORY" | "METADATA";
}> {
  const result: Array<{ label: string; source: "CATEGORY" | "METADATA" }> = [];

  for (const category of product.categories ?? []) {
    if (!/t[eé]cnicas?\s+de\s+marcaje/i.test(category)) continue;
    const parts = category.split(">").map((part) => part.trim()).filter(Boolean);
    const raw = parts.at(-1) ?? category;
    const label = canonicalTechniqueLabel(raw);
    if (label) result.push({ label, source: "CATEGORY" });
  }

  const metadata = product.metadata;
  if (metadata) {
    for (const key of ["markingTechniques", "techniques", "personalizationMethods"]) {
      const raw = metadata[key];
      const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
      for (const value of values) {
        if (typeof value !== "string") continue;
        const label = canonicalTechniqueLabel(value);
        if (label) result.push({ label, source: "METADATA" });
      }
    }
  }

  const unique = new Map<string, { label: string; source: "CATEGORY" | "METADATA" }>();
  for (const item of result) {
    const key = normalizeText(item.label);
    if (!unique.has(key) || item.source === "CATEGORY") unique.set(key, item);
  }
  return [...unique.values()];
}

async function walk(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory);
    const files: string[] = [];
    for (const entry of entries) {
      const full = join(directory, entry);
      const info = await stat(full);
      if (info.isDirectory()) files.push(...await walk(full));
      else files.push(full);
    }
    return files;
  } catch {
    return [];
  }
}

async function loadLatestCatalog(): Promise<{
  file?: string;
  products: readonly CatalogProduct[];
}> {
  const base = join(process.cwd(), "storage", "providers", "makito", "snapshots");
  const candidates = (await walk(base)).filter((file) => file.endsWith("normalized-products.json"));
  if (!candidates.length) return { products: Object.freeze([]) };

  const dated = await Promise.all(
    candidates.map(async (file) => ({ file, mtime: (await stat(file)).mtimeMs })),
  );
  dated.sort((a, b) => b.mtime - a.mtime);

  const selected = dated[0]?.file;
  if (!selected) return { products: Object.freeze([]) };

  const parsed = JSON.parse(await readFile(selected, "utf8")) as unknown;
  const products = Array.isArray(parsed)
    ? parsed.filter((item): item is CatalogProduct => Boolean(item) && typeof item === "object")
    : [];

  return { file: selected, products: Object.freeze(products) };
}

function makeIndexes(products: readonly CatalogProduct[]) {
  const byExternal = new Map<string, CatalogProduct>();
  for (const product of products) {
    for (const value of [product.externalId, product.supplierReference]) {
      const key = asString(value);
      if (key && !byExternal.has(key)) byExternal.set(key, product);
    }
  }
  return { byExternal };
}

function classify(
  support: number,
  labeledOccurrences: number,
  totalOccurrences: number,
): { confidence: number; status: MakitoTechniqueDictionaryStatus; recommended: boolean } {
  const confidence = labeledOccurrences > 0 ? support / labeledOccurrences : 0;

  if (support >= 5 && confidence >= 0.9) {
    return { confidence, status: "CONFIRMED", recommended: true };
  }
  if (support >= 3 && confidence >= 0.7) {
    return { confidence, status: "PROBABLE", recommended: false };
  }
  if (labeledOccurrences > 0) {
    return { confidence, status: "REVIEW", recommended: false };
  }
  return { confidence: 0, status: "UNKNOWN", recommended: false };
}

export async function buildMakitoTechniqueDictionary(
  raw: Readonly<Record<string, unknown>>,
): Promise<MakitoTechniqueDictionary> {
  const catalog = await loadLatestCatalog();
  const { byExternal } = makeIndexes(catalog.products);
  const accumulators = new Map<string, Accumulator>();

  for (const rowValue of extractMakitoPrintConfigProducts(raw)) {
    if (!rowValue || typeof rowValue !== "object" || Array.isArray(rowValue)) continue;
    const row = rowValue as Readonly<Record<string, unknown>>;
    const productId = asString(row.id);
    if (!productId) continue;

    const product = byExternal.get(productId);
    const productLabels = product ? labelsFromProduct(product) : [];

    const areas = Array.isArray(row.areas) ? row.areas : [];
    for (const areaValue of areas) {
      if (!areaValue || typeof areaValue !== "object" || Array.isArray(areaValue)) continue;
      const area = areaValue as Readonly<Record<string, unknown>>;
      const parsed = parseMakitoTechniqueString(area.techniques);

      for (const token of parsed.tokens) {
        const code = token.match(/^\d{6}/)?.[0];
        if (!code) continue;

        let acc = accumulators.get(code);
        if (!acc) {
          acc = {
            totalOccurrences: 0,
            labels: new Map(),
            sampleProductIds: new Set(),
          };
          accumulators.set(code, acc);
        }

        acc.totalOccurrences += 1;
        if (acc.sampleProductIds.size < 12) acc.sampleProductIds.add(productId);

        for (const item of productLabels) {
          const key = normalizeText(item.label);
          const existing = acc.labels.get(key);
          if (existing) {
            existing.count += 1;
            if (item.source === "CATEGORY") existing.source = "CATEGORY";
          } else {
            acc.labels.set(key, { count: 1, source: item.source });
          }
        }
      }
    }
  }

  const entries: MakitoTechniqueDictionaryEntry[] = [];

  for (const [providerCode, acc] of accumulators) {
    // Rebuild readable labels from map keys using canonical matching.
    const readableEvidence = [...acc.labels.entries()]
      .map(([normalizedKey, item]) => {
        const label =
          CANONICAL_RULES.find(([, canonical]) => normalizeText(canonical) === normalizedKey)?.[1] ??
          normalizedKey;
        return { label, count: item.count, source: item.source };
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    const labeledOccurrences = readableEvidence.reduce((sum, item) => sum + item.count, 0);
    const top = readableEvidence[0];
    const support = top?.count ?? 0;
    const classification = classify(support, labeledOccurrences, acc.totalOccurrences);

    entries.push(Object.freeze({
      providerCode,
      ...(top ? { candidateName: top.label } : {}),
      confidence: Number(classification.confidence.toFixed(4)),
      support,
      labeledOccurrences,
      totalOccurrences: acc.totalOccurrences,
      status: classification.status,
      recommendedForNormalization: classification.recommended,
      evidence: Object.freeze(readableEvidence.slice(0, 10)),
      sampleProductIds: Object.freeze([...acc.sampleProductIds]),
    }));
  }

  entries.sort((a, b) => a.providerCode.localeCompare(b.providerCode));

  const stats = {
    codes: entries.length,
    confirmed: entries.filter((entry) => entry.status === "CONFIRMED").length,
    probable: entries.filter((entry) => entry.status === "PROBABLE").length,
    review: entries.filter((entry) => entry.status === "REVIEW").length,
    unknown: entries.filter((entry) => entry.status === "UNKNOWN").length,
  };

  const dictionary: MakitoTechniqueDictionary = Object.freeze({
    provider: "makito",
    generatedAt: new Date().toISOString(),
    ...(catalog.file ? { catalogSnapshot: catalog.file } : {}),
    stats: Object.freeze(stats),
    entries: Object.freeze(entries),
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DICTIONARY_FILE, JSON.stringify(dictionary, null, 2), "utf8");

  return dictionary;
}

export async function getMakitoTechniqueDictionary():
Promise<MakitoTechniqueDictionary | undefined> {
  try {
    return JSON.parse(await readFile(DICTIONARY_FILE, "utf8")) as MakitoTechniqueDictionary;
  } catch {
    return undefined;
  }
}
