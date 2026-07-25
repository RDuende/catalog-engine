import type {
  RecommendationCandidate,
  RecommendationQuery,
  RecommendationScoreFactor,
  RecommendationWeights
} from "./recommendation.types.js";
import { clamp01, normalizeText, roundScore, tokenize } from "./recommendation.utils.js";

function factor(
  code: RecommendationScoreFactor["code"],
  label: string,
  score: number,
  weight: number,
  evidence?: unknown
): RecommendationScoreFactor {
  const normalized = clamp01(score);
  return {
    code,
    label,
    score: roundScore(normalized),
    weight: roundScore(weight),
    contribution: roundScore(normalized * weight),
    ...(evidence === undefined ? {} : { evidence })
  };
}

function textScore(candidate: RecommendationCandidate, query: RecommendationQuery): number {
  const tokens = tokenize(query.text);
  if (tokens.length === 0) return 0;

  const name = normalizeText(candidate.name);
  const haystack = normalizeText([
    candidate.name,
    candidate.sku ?? "",
    candidate.shortDescription ?? "",
    candidate.description ?? "",
    ...candidate.categories.flatMap((category) => [category.name, category.slug]),
    ...candidate.knowledgeLinks.flatMap((link) => [link.nodeName, link.nodeSlug]),
    ...candidate.customizations.flatMap((customization) => [customization.name, customization.slug])
  ].join(" "));

  let matched = 0;
  let bonus = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) matched += 1;
    if (name.includes(token)) bonus += 0.25;
  }

  return clamp01(matched / tokens.length + bonus / tokens.length);
}

function knowledgeScore(candidate: RecommendationCandidate, query: RecommendationQuery): number {
  const tokens = tokenize(query.text);
  const explicit = new Set(query.knowledgeNodeSlugs ?? []);
  let best = 0;

  for (const link of candidate.knowledgeLinks) {
    const nodeText = normalizeText(`${link.nodeName} ${link.nodeSlug}`);
    const tokenMatch = tokens.some((token) => nodeText.includes(token));
    const explicitMatch = explicit.has(link.nodeSlug);
    if (!tokenMatch && !explicitMatch) continue;

    best = Math.max(best, clamp01(link.weight) * clamp01(link.confidence));
  }

  return best;
}

function categoryScore(candidate: RecommendationCandidate, query: RecommendationQuery): number {
  const explicit = new Set(query.categorySlugs ?? []);
  const tokens = tokenize(query.text);
  const matched = candidate.categories.filter((category) =>
    explicit.has(category.slug) ||
    tokens.some((token) => normalizeText(`${category.name} ${category.slug}`).includes(token))
  );

  if (matched.length === 0) return 0;
  return matched.some((category) => category.isPrimary) ? 1 : 0.8;
}

function budgetScore(candidate: RecommendationCandidate, query: RecommendationQuery): number {
  if (query.budgetMin == null && query.budgetMax == null) return 0;
  const price = candidate.prices.at(0)?.amount;
  if (price == null) return 0;

  if (query.budgetMin != null && price < query.budgetMin) {
    return clamp01(price / Math.max(query.budgetMin, 0.01));
  }

  if (query.budgetMax != null && price > query.budgetMax) {
    return clamp01(query.budgetMax / Math.max(price, 0.01));
  }

  return 1;
}

function customizationScore(candidate: RecommendationCandidate, query: RecommendationQuery): number {
  const requested = new Set(query.customizationSlugs ?? []);
  if (requested.size === 0) return candidate.customizable ? 0.65 : 0;

  const available = new Set(candidate.customizations.map((item) => item.slug));
  const matches = [...requested].filter((slug) => available.has(slug)).length;
  return matches / requested.size;
}

export function scoreRecommendationCandidate(
  candidate: RecommendationCandidate,
  query: RecommendationQuery,
  weights: RecommendationWeights
): readonly RecommendationScoreFactor[] {
  const text = textScore(candidate, query);
  const knowledge = knowledgeScore(candidate, query);
  const category = categoryScore(candidate, query);
  const budget = budgetScore(candidate, query);
  const customization = customizationScore(candidate, query);
  const popularity = clamp01(Math.max(candidate.popularityScore, candidate.recommendationScore) / 100);

  return [
    factor("TEXT_MATCH", "Coincidencia con la consulta", text, weights.text),
    factor("KNOWLEDGE_MATCH", "Afinidad con el grafo de conocimiento", knowledge, weights.knowledge),
    factor("CATEGORY_MATCH", "Categoría adecuada", category, weights.category),
    factor("BUDGET_MATCH", "Encaje en el presupuesto", budget, weights.budget, candidate.prices.at(0) ?? null),
    factor("CUSTOMIZATION_MATCH", "Técnicas de personalización compatibles", customization, weights.customization),
    factor("POPULARITY", "Popularidad y relevancia histórica", popularity, weights.popularity),
    factor("FEATURED", "Producto destacado", candidate.featured ? 1 : 0, weights.featured),
    ...(query.customizableOnly
      ? [factor("CUSTOMIZABLE", "El producto es personalizable", candidate.customizable ? 1 : 0, 0)]
      : [])
  ];
}
