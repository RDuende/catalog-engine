import type { ProductBrain, ProductBrainSource, ProductGiftRole, ScoredTaxonomyValue } from "./product-brain.types.js";

const VERSION = "product-brain-rules-v3-primary-object-whole-word";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function sourceText(source: ProductBrainSource): string {
  return normalize([
    source.name,
    source.description,
    source.shortDescription,
    ...source.categories,
    ...source.tags,
    source.material,
    JSON.stringify(source.attributes),
    JSON.stringify(source.metadata),
  ].filter(Boolean).join(" "));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(text: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  // Límites Unicode: evita coincidencias parciales como "mar" dentro de
  // "marcapáginas" o "sport" dentro de "transporte".
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedTerm)}([^\\p{L}\\p{N}]|$)`, "iu").test(text);
}

function contains(text: string, terms: readonly string[]): string[] {
  return terms.filter((term) => containsTerm(text, term));
}

/**
 * Reglas de objeto físico. Se evalúan antes que formas y temáticas.
 * "Aplaudidor con diseño de balón" debe ser clapper, no football_ball.
 */
const PHYSICAL_OBJECT_RULES = [
  { id: "keyring", terms: ["llavero", "keyring"] },
  { id: "clapper", terms: ["aplaudidor", "clapper"] },
  { id: "anti_stress", terms: ["antiestres", "antiestrés", "anti stress"] },
  { id: "notebook", terms: ["bloc de notas", "bloc notas", "block de notas", "blocs de notas", "libreta", "cuaderno", "notebook"] },
  { id: "headphones", terms: ["auriculares", "auricular", "headphones", "earbuds"] },
  { id: "pen", terms: ["boligrafo", "bolígrafo", "pen"] },
  { id: "whistle", terms: ["silbato", "whistle"] },
  { id: "sports_bottle", terms: ["botella deportiva", "bidon", "bidón", "botella"] },
  { id: "backpack", terms: ["mochila", "backpack"] },
  { id: "trophy", terms: ["trofeo", "copa", "medalla"] },
  { id: "tshirt", terms: ["camiseta", "t-shirt", "tshirt"] },
  { id: "canvas", terms: ["lienzo", "canvas"] },
  { id: "tote_bag", terms: ["bolsa de tela", "tote bag", "bolsa tote"] },
  { id: "towel", terms: ["toalla"] },
  { id: "mug", terms: ["taza", "mug"] },
] as const;

const INTEREST_RULES = [
  { id: "football", terms: ["futbol", "football", "balon de futbol", "estadio", "porteria", "arbitro"] },
  { id: "sports", terms: ["deporte", "sport", "entrenamiento", "fitness"] },
  { id: "nautical", terms: ["barco", "nautica", "nautico", "velero", "marino", "maritimo"] },
  { id: "sustainability", terms: ["rpet", "reciclado", "sostenible", "bambu", "corcho"] },
  { id: "travel", terms: ["viaje", "viajes", "equipaje"] },
  { id: "music", terms: ["musica", "altavoz", "auriculares"] },
] as const;

const SHAPE_RULES = [
  { id: "football_ball", terms: ["balon de futbol", "balon futbol", "pelota de futbol", "football ball"] },
] as const;

function scoredRules(text: string, rules: readonly { id: string; terms: readonly string[] }[]): ScoredTaxonomyValue[] {
  return rules.flatMap((rule) => {
    const evidence = contains(text, rule.terms);
    if (evidence.length === 0) return [];
    return [{ id: rule.id, score: Math.min(1, 0.62 + evidence.length * 0.12), evidence: Object.freeze(evidence) }];
  });
}

function inferRoles(objectType: string, text: string): readonly ProductGiftRole[] {
  if (["football_ball", "backpack", "trophy", "tshirt", "mug", "notebook", "headphones", "canvas", "tote_bag"].includes(objectType)) {
    return Object.freeze(["PRIMARY", "BUNDLE_COMPONENT"]);
  }
  if (["keyring", "sports_bottle", "towel", "pen"].includes(objectType)) {
    return Object.freeze(["COMPLEMENT", "BUNDLE_COMPONENT"]);
  }
  if (["anti_stress", "clapper", "whistle"].includes(objectType) || text.includes("promocional")) {
    return Object.freeze(["PROMOTIONAL", "BUNDLE_COMPONENT"]);
  }
  return Object.freeze(["COMPLEMENT", "BUNDLE_COMPONENT"]);
}

function isActualFootballBall(source: ProductBrainSource): boolean {
  const name = normalize(source.name);
  const description = normalize(source.description ?? source.shortDescription ?? "");
  const categories = normalize(source.categories.join(" "));

  // Evidencia fuerte: el nombre o el inicio de la descripción identifica el objeto como balón.
  if (/^(balon|pelota)(?: de)? futbol\b/.test(name)) return true;
  if (/^(balon|pelota)(?: de)? futbol\b/.test(description)) return true;

  // La familia de catálogo puede confirmar que es un balón real, pero no basta una mención temática.
  const ballCategory = /(^|\s|>)balones?(\s|>|$)/.test(categories);
  const thematicOnly = /(diseno|diseño|forma|aspecto|figura|relieve|estampado) (?:de |con )?(?:un )?(balon|pelota)/.test(description);
  return ballCategory && !thematicOnly;
}

function inferObjectType(source: ProductBrainSource, text: string): { id: string; confidence: number } {
  const name = normalize(source.name);
  const categories = normalize(source.categories.join(" "));
  const description = normalize(source.description ?? source.shortDescription ?? "");

  // 1) Nombre comercial/descriptivo, cuando identifica el objeto.
  for (const rule of PHYSICAL_OBJECT_RULES) {
    const evidence = contains(name, rule.terms);
    if (evidence.length > 0) return { id: rule.id, confidence: Math.min(0.99, 0.9 + evidence.length * 0.04) };
  }

  // 2) Categoría específica del proveedor. Tiene prioridad sobre accesorios
  // mencionados en la descripción (p. ej. bloc de notas con bolígrafo incluido).
  for (const rule of PHYSICAL_OBJECT_RULES) {
    const evidence = contains(categories, rule.terms);
    if (evidence.length > 0) return { id: rule.id, confidence: Math.min(0.98, 0.87 + evidence.length * 0.04) };
  }

  // 3) Descripción. Las reglas están ordenadas para que el objeto principal
  // compuesto ("bloc de notas") gane frente a accesorios ("bolígrafo").
  for (const rule of PHYSICAL_OBJECT_RULES) {
    const evidence = contains(description, rule.terms);
    if (evidence.length > 0) return { id: rule.id, confidence: Math.min(0.97, 0.8 + evidence.length * 0.06) };
  }

  if (isActualFootballBall(source)) return { id: "football_ball", confidence: 0.96 };

  // Último recurso: texto agregado de atributos y metadatos.
  for (const rule of PHYSICAL_OBJECT_RULES) {
    const evidence = contains(text, rule.terms);
    if (evidence.length > 0) return { id: rule.id, confidence: Math.min(0.82, 0.68 + evidence.length * 0.04) };
  }
  return { id: "generic_object", confidence: 0.45 };
}

function methods(source: ProductBrainSource, text: string): string[] {
  const candidates = ["serigrafia", "transfer", "sublimacion", "grabado laser", "laser", "uv", "dtf", "bordado", "tampografia"];
  return unique([
    ...contains(text, candidates),
    ...((Array.isArray(source.attributes.personalizationMethods) ? source.attributes.personalizationMethods : []) as unknown[])
      .filter((item): item is string => typeof item === "string"),
  ]);
}

export function classifyProductBrain(source: ProductBrainSource, now = new Date().toISOString()): ProductBrain {
  const text = sourceText(source);
  const object = inferObjectType(source, text);
  const interests = scoredRules(text, INTEREST_RULES);
  const shapes = scoredRules(text, SHAPE_RULES);
  const personalizationMethods = methods(source, text);
  const personalizationScore = Math.min(1, (source.customizable ? 0.65 : 0.2) + personalizationMethods.length * 0.1);
  const roles = inferRoles(object.id, text);
  const primaryCapable = roles.includes("PRIMARY");
  const giftSuitabilityScore = Math.min(1, (primaryCapable ? 0.72 : 0.5) + personalizationScore * 0.2 + (interests.length > 0 ? 0.08 : 0));
  const bundleScore = roles.includes("BUNDLE_COMPONENT") ? Math.min(1, 0.65 + personalizationScore * 0.25) : 0.35;
  const premiumScore = /metal|madera|bambu|bambú|cuero|polipiel|cristal|premium/.test(text) ? 0.72 : 0.38;
  const confidence = Math.min(1, object.confidence * 0.55 + (interests.length > 0 ? 0.22 : 0.08) + (personalizationMethods.length > 0 ? 0.18 : 0.08));
  const searchTerms = unique([
    object.id,
    ...interests.map((item) => item.id),
    ...interests.flatMap((item) => item.evidence),
    ...shapes.map((item) => item.id),
    ...shapes.flatMap((item) => item.evidence),
    ...source.categories,
    ...source.tags,
  ]);

  return Object.freeze({
    productId: source.id,
    version: VERSION,
    status: confidence >= 0.58 ? "READY" : "REVIEW_REQUIRED",
    objectType: object.id,
    giftRoles: roles,
    interests: Object.freeze(interests),
    shapes: Object.freeze(shapes),
    occasions: Object.freeze([]),
    recipientProfiles: Object.freeze([]),
    emotionalGoals: Object.freeze([]),
    personalizationScore: Number(personalizationScore.toFixed(4)),
    personalizationMethods: Object.freeze(personalizationMethods),
    bundleScore: Number(bundleScore.toFixed(4)),
    premiumScore: Number(premiumScore.toFixed(4)),
    giftSuitabilityScore: Number(giftSuitabilityScore.toFixed(4)),
    classificationConfidence: Number(confidence.toFixed(4)),
    searchTerms: Object.freeze(searchTerms),
    generatedAt: now,
  });
}
