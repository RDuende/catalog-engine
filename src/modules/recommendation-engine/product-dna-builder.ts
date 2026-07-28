import { canonicalTokens, normalizeCanonicalText } from "../canonical-product/canonical-normalizer.js";
import type { CanonicalProduct } from "../canonical-product/canonical-types.js";
import type { ProductDNA } from "./recommendation-types.js";
import type { SemanticTaxonomyEngine } from "../semantic-taxonomy/taxonomy-engine.js";

const RULES: Record<string, Partial<Omit<ProductDNA, "productId" | "materials" | "categories" | "terms">>> = {
  bambu: { values: ["eco", "natural", "sostenible"], styles: ["natural", "minimalista"], personalization: ["laser"] },
  corcho: { values: ["eco", "natural", "sostenible"], styles: ["natural"], personalization: ["laser"] },
  reciclado: { values: ["eco", "sostenible", "responsable"] },
  acero: { values: ["duradero"], styles: ["elegante", "moderno"], personalization: ["laser"] },
  aluminio: { values: ["duradero"], styles: ["moderno"], personalization: ["laser"] },
  madera: { values: ["natural", "duradero"], styles: ["elegante", "artesanal"], personalization: ["laser"] },
  botella: { uses: ["hidratacion", "deporte", "oficina", "outdoor"], audiences: ["deportista", "empresa", "profesor"], occasions: ["evento", "jubilacion", "navidad"] },
  taza: { uses: ["hogar", "oficina", "bebida"], audiences: ["empresa", "profesor", "familia"], occasions: ["cumpleanos", "jubilacion", "navidad"], personalization: ["sublimacion", "uv", "serigrafia"] },
  libreta: { uses: ["escritura", "oficina", "estudio"], audiences: ["profesor", "estudiante", "empresa"], occasions: ["jubilacion", "evento", "navidad"], personalization: ["laser", "uv", "serigrafia"] },
  boligrafo: { uses: ["escritura", "oficina"], audiences: ["profesor", "empresa", "estudiante"], occasions: ["evento", "jubilacion"], personalization: ["laser", "tampografia", "uv"] },
  premium: { styles: ["elegante", "premium"], values: ["calidad"], quality: "premium" },
  infantil: { audiences: ["nino"], styles: ["divertido", "infantil"] },
  golf: { uses: ["golf", "outdoor"], audiences: ["deportista", "directivo"], sectors: ["deporte"], styles: ["premium"] },
};

function add(target: Set<string>, values: string[] | undefined): void {
  for (const value of values ?? []) target.add(normalizeCanonicalText(value));
}

export function buildProductDNA(product: CanonicalProduct, taxonomy?: SemanticTaxonomyEngine): ProductDNA {
  const pools = {
    audiences: new Set<string>(), occasions: new Set<string>(), styles: new Set<string>(), values: new Set<string>(),
    uses: new Set<string>(), seasons: new Set<string>(), sectors: new Set<string>(), personalization: new Set<string>(),
  };
  let quality: ProductDNA["quality"] = "standard";
  let sustainabilityScore = 0;
  const sourceTokens = canonicalTokens([
    product.name,
    product.family ?? "",
    ...product.categories,
    ...product.materials,
    ...product.terms,
  ]);
  for (const token of sourceTokens) {
    const rule = RULES[token];
    if (!rule) continue;
    add(pools.audiences, rule.audiences);
    add(pools.occasions, rule.occasions);
    add(pools.styles, rule.styles);
    add(pools.values, rule.values);
    add(pools.uses, rule.uses);
    add(pools.seasons, rule.seasons);
    add(pools.sectors, rule.sectors);
    add(pools.personalization, rule.personalization);
    if (rule.quality) quality = rule.quality;
  }
  if (taxonomy) {
    const expansion = taxonomy.expand([...sourceTokens], { maxDepth: 4, minimumScore: 0.35 });
    const valueConcepts = new Set(["eco", "sostenible", "responsable", "natural", "duradero", "calidad"]);
    const styleConcepts = new Set(["elegante", "moderno", "minimalista", "artesanal", "premium", "divertido", "infantil"]);
    const personalizationConcepts = new Set(["laser", "uv", "sublimacion", "serigrafia", "tampografia", "bordado", "dtf"]);
    for (const item of expansion) {
      sourceTokens.add(item.concept);
      if (valueConcepts.has(item.concept)) pools.values.add(item.concept);
      if (styleConcepts.has(item.concept)) pools.styles.add(item.concept);
      if (personalizationConcepts.has(item.concept)) pools.personalization.add(item.concept);
    }
  }
  const ecoTokens = ["bambu", "corcho", "reciclado", "sostenible", "reutilizable"];
  sustainabilityScore = Math.min(100, ecoTokens.filter((token) => sourceTokens.has(token) || pools.values.has(token)).length * 25);
  return {
    productId: product.id,
    audiences: [...pools.audiences], occasions: [...pools.occasions], styles: [...pools.styles], values: [...pools.values],
    uses: [...pools.uses], seasons: [...pools.seasons], sectors: [...pools.sectors], personalization: [...pools.personalization],
    materials: product.materials.map(normalizeCanonicalText), categories: product.categories.map(normalizeCanonicalText),
    terms: [...sourceTokens], quality, sustainabilityScore,
  };
}
