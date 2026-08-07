import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { extractMakitoPrintConfigProducts, mapMakitoPrintConfigProduct } from "./makito-marking.mapper.js";
import { mergeProviderMarkingProfile } from "./marking-intelligence.service.js";
import type {
  MarkingTechniqueCode,
  ProductMarkingArea,
  ProductMarkingProfile,
  ProductMarkingTechnique,
} from "./marking-intelligence.types.js";

type Obj = Record<string, unknown>;

export interface MakitoOfficialPriceTier {
  readonly threshold?: string;
  readonly type?: string;
  readonly price?: number;
  readonly additionalPrice?: number;
}

export interface MakitoOfficialPricing {
  readonly currency?: string;
  readonly minPrice?: number;
  readonly minQuantity?: number;
  readonly setupFee?: number;
  readonly additionalSetupFee?: number;
  readonly tiers: readonly MakitoOfficialPriceTier[];
}

export interface MakitoOfficialTechnique {
  readonly providerCode: string;
  readonly providerVariantCode?: string;
  readonly providerCategory: string;
  readonly providerFamily: string;
  readonly normalizedCode: MarkingTechniqueCode;
  readonly displayName: string;
  readonly terms?: string;
  readonly pricing?: MakitoOfficialPricing;
  readonly confidence: 1;
  readonly source: "PROVIDER_OFFICIAL";
  readonly providerRaw: unknown;
}

export interface MakitoOfficialTechniqueCatalog {
  readonly provider: "makito";
  readonly source: "print-price-list";
  readonly generatedAt: string;
  readonly sourceGeneratedAt?: string;
  readonly techniques: readonly MakitoOfficialTechnique[];
}

const DATA_DIR = join(process.cwd(), "storage", "marking-intelligence");
const CATALOG_FILE = join(DATA_DIR, "makito-official-techniques.json");

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  const candidate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : undefined;
}

function titleCaseOfficial(value: string): string {
  return value
    .toLocaleLowerCase("es")
    .replace(/(^|[\s(/+-])([a-záéíóúüñ])/g, (_m, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase("es"))
    .replace(/\bDtf\b/g, "DTF")
    .replace(/\bUv\b/g, "UV")
    .replace(/\bCo2\b/g, "CO₂")
    .replace(/\bFullcolor\b/gi, "Fullcolor");
}

export function classifyMakitoOfficialTechnique(category: string): {
  normalizedCode: MarkingTechniqueCode;
  providerFamily: string;
} {
  const text = category.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();

  if (/\bDTF\b.*\bUV\b|\bUV\b.*\bDTF\b/.test(text)) {
    return { normalizedCode: "DTF_UV", providerFamily: "DTF_UV" };
  }
  if (/\bDTF\b/.test(text)) {
    return { normalizedCode: "DTF", providerFamily: "DTF" };
  }
  if (/TAMPOGRAF/.test(text)) {
    return { normalizedCode: "PAD_PRINTING", providerFamily: "TAMPOGRAFIA" };
  }
  if (/SERIGRAF/.test(text) && !/TRANSFER/.test(text)) {
    return { normalizedCode: "SCREEN_PRINTING", providerFamily: "SERIGRAFIA" };
  }
  if (/BORDAD/.test(text)) {
    return { normalizedCode: "EMBROIDERY", providerFamily: "BORDADO" };
  }
  if (/SUBLIM/.test(text)) {
    return { normalizedCode: "SUBLIMATION", providerFamily: "SUBLIMACION" };
  }
  if (/LASER/.test(text)) {
    return { normalizedCode: "LASER", providerFamily: "GRABACION_LASER" };
  }
  if (/TRANSFER/.test(text)) {
    return {
      normalizedCode: "TRANSFER",
      providerFamily: /DIGITAL/.test(text) ? "TRANSFER_DIGITAL" : "TRANSFER_SERIGRAFICO",
    };
  }
  if (/DOMING|GOTA DE RESINA/.test(text)) {
    return { normalizedCode: "OTHER", providerFamily: "DOMING" };
  }
  if (/TERMOGRAB/.test(text)) {
    return { normalizedCode: "OTHER", providerFamily: "TERMOGRABADO" };
  }
  if (/CUATRICROM/.test(text)) {
    return { normalizedCode: "DIGITAL_PRINT", providerFamily: "CUATRICROMIA" };
  }
  if (/DIGITAL/.test(text)) {
    return { normalizedCode: "DIGITAL_PRINT", providerFamily: "DIGITAL" };
  }
  if (/\bUV\b/.test(text)) {
    return { normalizedCode: "UV_PRINT", providerFamily: "IMPRESION_UV" };
  }

  return { normalizedCode: "OTHER", providerFamily: "OTHER" };
}

export function extractMakitoPrintPriceRows(raw: unknown): Obj[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const root = raw as Obj;

  if (Array.isArray(root.printPriceList)) {
    return root.printPriceList.filter(
      (item): item is Obj => Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  }

  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const list = (data as Obj).printPriceList;
    if (Array.isArray(list)) {
      return list.filter(
        (item): item is Obj => Boolean(item) && typeof item === "object" && !Array.isArray(item),
      );
    }
  }

  return [];
}

function parsePricing(value: unknown): MakitoOfficialPricing | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Obj;
  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers : [];

  const tiers = rawTiers.flatMap((item): MakitoOfficialPriceTier[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const tier = item as Obj;
    return [{
      ...(str(tier.threshold) ? { threshold: str(tier.threshold) } : {}),
      ...(str(tier.type) ? { type: str(tier.type) } : {}),
      ...(num(tier.price) !== undefined ? { price: num(tier.price) } : {}),
      ...(num(tier.additionalPrice) !== undefined ? { additionalPrice: num(tier.additionalPrice) } : {}),
    }];
  });

  return Object.freeze({
    ...(str(raw.currency) ? { currency: str(raw.currency) } : {}),
    ...(num(raw.minPrice) !== undefined ? { minPrice: num(raw.minPrice) } : {}),
    ...(num(raw.minQuantity) !== undefined ? { minQuantity: num(raw.minQuantity) } : {}),
    ...(num(raw.setupFee) !== undefined ? { setupFee: num(raw.setupFee) } : {}),
    ...(num(raw.additionalSetupFee) !== undefined
      ? { additionalSetupFee: num(raw.additionalSetupFee) }
      : {}),
    tiers: Object.freeze(tiers),
  });
}

export function buildMakitoOfficialTechniqueCatalog(
  raw: unknown,
): MakitoOfficialTechniqueCatalog {
  const rows = extractMakitoPrintPriceRows(raw);
  const techniques: MakitoOfficialTechnique[] = [];

  for (const row of rows) {
    const providerCode = str(row.id);
    const providerCategory = str(row.category);
    if (!providerCode || !providerCategory) continue;

    const classification = classifyMakitoOfficialTechnique(providerCategory);
    const terms = str(row.terms);
    const pricing = parsePricing(row.prices);

    techniques.push(Object.freeze({
      providerCode,
      ...(str(row.code) ? { providerVariantCode: str(row.code) } : {}),
      providerCategory,
      providerFamily: classification.providerFamily,
      normalizedCode: classification.normalizedCode,
      displayName: titleCaseOfficial(providerCategory),
      ...(terms ? { terms } : {}),
      ...(pricing ? { pricing } : {}),
      confidence: 1,
      source: "PROVIDER_OFFICIAL",
      providerRaw: row,
    }));
  }

  techniques.sort((a, b) => a.providerCode.localeCompare(b.providerCode));

  const root = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Obj : {};

  return Object.freeze({
    provider: "makito",
    source: "print-price-list",
    generatedAt: new Date().toISOString(),
    ...(str(root.generatedAt) ? { sourceGeneratedAt: str(root.generatedAt) } : {}),
    techniques: Object.freeze(techniques),
  });
}

export async function saveMakitoOfficialTechniqueCatalog(
  catalog: MakitoOfficialTechniqueCatalog,
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CATALOG_FILE, JSON.stringify(catalog, null, 2), "utf8");
}

export async function getMakitoOfficialTechniqueCatalog():
Promise<MakitoOfficialTechniqueCatalog | undefined> {
  try {
    return JSON.parse(await readFile(CATALOG_FILE, "utf8")) as MakitoOfficialTechniqueCatalog;
  } catch {
    return undefined;
  }
}

function enrichTechnique(
  technique: ProductMarkingTechnique,
  officialByCode: ReadonlyMap<string, MakitoOfficialTechnique>,
): ProductMarkingTechnique {
  const providerCode = technique.providerCode;
  const official = providerCode ? officialByCode.get(providerCode) : undefined;
  if (!official) return technique;

  return Object.freeze({
    ...technique,
    code: official.normalizedCode,
    name: official.displayName,
    providerCode: official.providerCode,
    providerVariantCode: official.providerVariantCode,
    providerCategory: official.providerCategory,
    providerFamily: official.providerFamily,
    providerOfficial: true,
    officialConfidence: 1,
    pricing: official.pricing,
    notes: official.terms ?? technique.notes,
    providerRaw: Object.freeze({
      printConfig: technique.providerRaw,
      printPriceList: official.providerRaw,
    }),
  });
}

function enrichProfile(
  profile: ProductMarkingProfile,
  officialByCode: ReadonlyMap<string, MakitoOfficialTechnique>,
): ProductMarkingProfile {
  const areas: ProductMarkingArea[] = profile.areas.map((area) => Object.freeze({
    ...area,
    techniques: Object.freeze(
      area.techniques.map((technique) => enrichTechnique(technique, officialByCode)),
    ),
  }));

  return Object.freeze({
    ...profile,
    areas: Object.freeze(areas),
    updatedBy: "makito-print-config+official-print-price-list",
  });
}

export async function syncMakitoOfficialMarkingV24(
  printConfigRaw: Readonly<Record<string, unknown>>,
  printPriceRaw: Readonly<Record<string, unknown>>,
): Promise<Readonly<Record<string, unknown>>> {
  const officialCatalog = buildMakitoOfficialTechniqueCatalog(printPriceRaw);
  await saveMakitoOfficialTechniqueCatalog(officialCatalog);

  const officialByCode = new Map(
    officialCatalog.techniques.map((technique) => [technique.providerCode, technique] as const),
  );

  const rows = extractMakitoPrintConfigProducts(printConfigRaw)
    .filter(
      (row): row is Readonly<Record<string, unknown>> =>
        Boolean(row) && typeof row === "object" && !Array.isArray(row),
    );

  let importedProducts = 0;
  let areas = 0;
  let techniqueOccurrences = 0;
  let officialOccurrences = 0;
  let normalizedOccurrences = 0;
  const usedCodes = new Set<string>();
  const missingCodes = new Set<string>();

  let kroper: ProductMarkingProfile | undefined;

  for (const row of rows) {
    const mapped = mapMakitoPrintConfigProduct(row);
    if (!mapped) continue;

    for (const area of mapped.areas) {
      for (const technique of area.techniques) {
        techniqueOccurrences += 1;
        if (technique.providerCode) {
          usedCodes.add(technique.providerCode);
          if (!officialByCode.has(technique.providerCode)) missingCodes.add(technique.providerCode);
        }
      }
    }

    const enriched = enrichProfile(mapped, officialByCode);

    for (const area of enriched.areas) {
      areas += 1;
      for (const technique of area.techniques) {
        if (technique.providerOfficial) officialOccurrences += 1;
        if (technique.code !== "OTHER") normalizedOccurrences += 1;
      }
    }

    const saved = await mergeProviderMarkingProfile(enriched);
    importedProducts += 1;

    if (saved.providerProductId === "14855") kroper = saved;
  }

  const officialCodesUsed = [...usedCodes].filter((code) => officialByCode.has(code));

  return Object.freeze({
    status: "imported",
    provider: "makito",
    source: "print-config+print-price-list",
    printConfigProducts: rows.length,
    importedProducts,
    areas,
    techniqueOccurrences,
    officialCatalogTechniques: officialCatalog.techniques.length,
    usedTechniqueCodes: usedCodes.size,
    officialMatchedCodes: officialCodesUsed.length,
    missingOfficialCodes: Object.freeze([...missingCodes].sort()),
    officialOccurrences,
    normalizedOccurrences,
    otherOccurrences: techniqueOccurrences - normalizedOccurrences,
    officialCatalogFile: CATALOG_FILE,
    kroper: kroper
      ? Object.freeze({
          productId: kroper.productId,
          providerProductId: kroper.providerProductId,
          areas: kroper.areas,
        })
      : undefined,
  });
}
