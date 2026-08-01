import { normalizeKey } from "./knowledge-graph.utils.js";
import type { CanonicalKnowledgeProduct, DetectedKnowledge } from "./knowledge-builder.types.js";
import type { KnowledgeEntityType, ProductKnowledgeRelation } from "./knowledge-graph.types.js";
import { dictionaryAliases, type KnowledgeDictionary } from "./knowledge-dictionary.js";

const MATERIAL_ALIASES: Record<string, string[]> = {
  "acero_inoxidable": ["acero inoxidable", "inox", "inoxidable", "stainless steel", "ss304"],
  aluminio: ["aluminio", "aluminium", "aluminum"],
  bambu: ["bambú", "bambu", "bamboo"],
  algodon: ["algodón", "algodon", "cotton"],
  "algodon_organico": ["algodón orgánico", "algodon organico", "organic cotton"],
  poliester: ["poliéster", "poliester", "polyester"],
  rpet: ["rpet", "recycled pet", "pet reciclado"],
  plastico: ["plástico", "plastico", "plastic"],
  madera: ["madera", "wood"],
  corcho: ["corcho", "cork"],
  vidrio: ["vidrio", "glass"],
  ceramica: ["cerámica", "ceramica", "ceramic"],
  papel: ["papel", "paper"],
  carton: ["cartón", "carton", "cardboard"],
  silicona: ["silicona", "silicone"],
  abs: ["abs"],
  pp: ["polipropileno", "polypropylene", "pp"],
  pet: ["pet"],
};

const TECHNIQUE_ALIASES: Record<string, string[]> = {
  "grabado_laser": ["grabado láser", "grabado laser", "laser engraving", "láser", "laser"],
  serigrafia: ["serigrafía", "serigrafia", "screen printing", "silkscreen"],
  tampografia: ["tampografía", "tampografia", "pad printing"],
  sublimacion: ["sublimación", "sublimacion", "sublimation"],
  bordado: ["bordado", "embroidery"],
  transfer: ["transfer", "transfer digital"],
  dtf: ["dtf", "direct to film"],
  "dtf_uv": ["dtf uv", "dtf_uv", "uv dtf"],
  "impresion_uv": ["impresión uv", "impresion uv", "uv printing"],
  doming: ["doming", "gota de resina"],
};

const CERTIFICATE_ALIASES: Record<string, string[]> = {
  fsc: ["fsc"],
  grs: ["grs", "global recycled standard"],
  oeko_tex: ["oeko-tex", "oeko tex", "oekotex"],
  reach: ["reach"],
  rohs: ["rohs"],
  food_safe: ["food safe", "apto alimentario", "contacto alimentario"],
};

function flatText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flatText).join(" ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key} ${flatText(item)}`).join(" ");
  return "";
}

function title(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/(^|\s)\p{L}/gu, letter => letter.toUpperCase());
}

function knownDetections(
  text: string,
  dictionary: Record<string, string[]>,
  type: KnowledgeEntityType,
  relationType: ProductKnowledgeRelation,
  confidence: number,
): DetectedKnowledge[] {
  const normalizedText = normalizeKey(text);
  const result: DetectedKnowledge[] = [];
  for (const [key, aliases] of Object.entries(dictionary)) {
    const match = aliases.find(alias => {
      const normalizedAlias = normalizeKey(alias);
      if (normalizedAlias.length <= 3) return new RegExp(`(?:^|_)${normalizedAlias}(?:_|$)`).test(normalizedText);
      return normalizedText.includes(normalizedAlias);
    });
    if (!match) continue;
    result.push({ type, relationType, key, name: title(aliases[0] ?? key), aliases, confidence, source: "INFERRED", metadata: { matchedAlias: match } });
  }
  return result;
}

function splitMaterials(value: string): string[] {
  return value.split(/[,;/+|]|\s+y\s+|\s+and\s+/i).map(item => item.trim()).filter(item => item.length >= 2 && item.length <= 80);
}

function scalarAttributes(product: CanonicalKnowledgeProduct): DetectedKnowledge[] {
  const values: Array<[string, unknown]> = [
    ["color", product.color], ["dimensions", product.dimensions], ["weight", product.weight], ["customizable", product.customizable],
    ...Object.entries(product.attributes ?? {}),
  ];
  const allowed = /capacity|capacidad|volume|volumen|size|talla|dimension|weight|peso|color|gender|genero|audience|publico/i;
  return values.flatMap(([key, value]) => {
    if (value == null || value === "" || (key !== "color" && key !== "dimensions" && key !== "weight" && key !== "customizable" && !allowed.test(key))) return [];
    if (typeof value === "object") return [];
    const shown = String(value).trim();
    if (!shown || shown.length > 120) return [];
    return [{
      type: "ATTRIBUTE" as const,
      relationType: "ATTRIBUTE" as const,
      key: `${normalizeKey(key)}:${normalizeKey(shown)}`,
      name: `${title(key)}: ${shown}`,
      aliases: [],
      confidence: 0.98,
      source: "PROVIDER" as const,
      metadata: { attribute: key, value },
    }];
  });
}

export function detectProductKnowledge(product: CanonicalKnowledgeProduct, dictionary?: KnowledgeDictionary): DetectedKnowledge[] {
  const materialAliases = dictionary ? { ...MATERIAL_ALIASES, ...dictionaryAliases(dictionary, "MATERIAL") } : MATERIAL_ALIASES;
  const techniqueAliases = dictionary ? { ...TECHNIQUE_ALIASES, ...dictionaryAliases(dictionary, "TECHNIQUE") } : TECHNIQUE_ALIASES;
  const certificateAliases = dictionary ? { ...CERTIFICATE_ALIASES, ...dictionaryAliases(dictionary, "CERTIFICATE") } : CERTIFICATE_ALIASES;
  const detected: DetectedKnowledge[] = [];
  if (product.brand?.trim()) detected.push({ type: "BRAND", relationType: "BRAND", key: normalizeKey(product.brand), name: title(product.brand), aliases: [product.brand], confidence: 1, source: "PROVIDER" });
  for (const category of product.categories ?? []) {
    if (category?.trim()) detected.push({ type: "CATEGORY", relationType: "CATEGORY", key: normalizeKey(category), name: title(category), aliases: [category], confidence: 1, source: "PROVIDER" });
  }
  const materialValues = [product.material, ...(product.variants ?? []).map(variant => variant.material)].filter((value): value is string => Boolean(value?.trim()));
  for (const raw of materialValues.flatMap(splitMaterials)) {
    const known = knownDetections(raw, materialAliases, "MATERIAL", "MATERIAL", 0.98);
    if (known.length) detected.push(...known.map(item => ({ ...item, source: "PROVIDER" as const })));
    else detected.push({ type: "MATERIAL", relationType: "MATERIAL", key: normalizeKey(raw), name: title(raw), aliases: [raw], confidence: 0.9, source: "PROVIDER" });
  }
  const searchable = [product.name, product.description, product.shortDescription, ...(product.tags ?? []), flatText(product.attributes), flatText(product.metadata)].join(" ");
  detected.push(...knownDetections(searchable, techniqueAliases, "TECHNIQUE", "TECHNIQUE", 0.86));
  detected.push(...knownDetections(searchable, certificateAliases, "CERTIFICATE", "CERTIFICATE", 0.9));
  detected.push(...knownDetections(searchable, materialAliases, "MATERIAL", "MATERIAL", 0.78));
  detected.push(...scalarAttributes(product));

  const unique = new Map<string, DetectedKnowledge>();
  for (const item of detected) {
    if (!item.key) continue;
    const id = `${item.type}:${item.key}`;
    const previous = unique.get(id);
    if (!previous || item.confidence > previous.confidence) unique.set(id, item);
  }
  return [...unique.values()];
}
