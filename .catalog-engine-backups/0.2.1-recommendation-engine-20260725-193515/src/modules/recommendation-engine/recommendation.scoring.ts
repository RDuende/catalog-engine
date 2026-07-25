import {
  DEFAULT_RECOMMENDATION_WEIGHTS,
  type RecommendationCandidate,
  type RecommendationFactor,
  type RecommendationItemResult,
  type RecommendationQuery,
  type RecommendationWeights
} from "./recommendation.types.js";
import { clamp01, normalizeRecommendationText, roundScore, tokenizeRecommendationText } from "./recommendation.utils.js";

function resolveWeights(query: RecommendationQuery): RecommendationWeights {
  return { ...DEFAULT_RECOMMENDATION_WEIGHTS, ...query.weights };
}

function choosePrice(candidate: RecommendationCandidate, query: RecommendationQuery) {
  const currency = query.currency ?? "EUR";
  const quantity = Math.max(1, query.quantity ?? 1);
  const compatible = candidate.prices
    .filter((price) => price.currency === currency)
    .filter((price) => price.minQuantity <= quantity)
    .filter((price) => price.maxQuantity === null || price.maxQuantity >= quantity)
    .sort((a, b) => a.amount - b.amount);

  return compatible.at(0) ?? null;
}

function scoreKnowledge(candidate: RecommendationCandidate, query: RecommendationQuery): RecommendationFactor {
  const requested = new Set((query.knowledgeSlugs ?? []).map(normalizeRecommendationText));
  if (!requested.size) {
    return { code: "knowledge", score: 0.5, weightedScore: 0, explanation: "Sin criterios de conocimiento obligatorios." };
  }

  const matches = candidate.knowledge.filter((link) => requested.has(normalizeRecommendationText(link.slug)));
  const score = clamp01(matches.reduce((total, link) => total + link.weight * link.confidence, 0) / requested.size);
  return {
    code: "knowledge",
    score,
    weightedScore: 0,
    explanation: matches.length
      ? `Coincide con ${matches.map((match) => match.name).join(", ")}.`
      : "No coincide con los conceptos solicitados."
  };
}

function scoreCategory(candidate: RecommendationCandidate, query: RecommendationQuery): RecommendationFactor {
  const requested = new Set((query.categorySlugs ?? []).map(normalizeRecommendationText));
  if (!requested.size) {
    return { code: "category", score: 0.5, weightedScore: 0, explanation: "Sin categoría obligatoria." };
  }

  const matches = candidate.categories.filter((category) => requested.has(normalizeRecommendationText(category.slug)));
  const score = clamp01(matches.length / requested.size);
  return {
    code: "category",
    score,
    weightedScore: 0,
    explanation: matches.length
      ? `Pertenece a ${matches.map((match) => match.name).join(", ")}.`
      : "No pertenece a las categorías solicitadas."
  };
}

function scoreBudget(candidate: RecommendationCandidate, query: RecommendationQuery): RecommendationFactor {
  const price = choosePrice(candidate, query);
  if (query.budgetMin === undefined && query.budgetMax === undefined) {
    return { code: "budget", score: 0.5, weightedScore: 0, explanation: "Sin límite de presupuesto." };
  }
  if (!price) {
    return { code: "budget", score: 0, weightedScore: 0, explanation: "No hay un precio compatible con la cantidad y moneda." };
  }

  const minOk = query.budgetMin === undefined || price.amount >= query.budgetMin;
  const maxOk = query.budgetMax === undefined || price.amount <= query.budgetMax;
  const score = minOk && maxOk ? 1 : 0;
  return {
    code: "budget",
    score,
    weightedScore: 0,
    explanation: score === 1
      ? `Precio compatible: ${price.amount.toFixed(2)} ${price.currency}.`
      : `Precio fuera del presupuesto: ${price.amount.toFixed(2)} ${price.currency}.`
  };
}

function scoreCustomizable(candidate: RecommendationCandidate, query: RecommendationQuery): RecommendationFactor {
  if (query.customizable === undefined) {
    return { code: "customizable", score: 0.5, weightedScore: 0, explanation: "La personalización no es obligatoria." };
  }
  const score = candidate.customizable === query.customizable ? 1 : 0;
  return {
    code: "customizable",
    score,
    weightedScore: 0,
    explanation: candidate.customizable ? "Producto personalizable." : "Producto no marcado como personalizable."
  };
}

function scoreText(candidate: RecommendationCandidate, query: RecommendationQuery): RecommendationFactor {
  const tokens = tokenizeRecommendationText(query.text ?? "");
  if (!tokens.length) {
    return { code: "text", score: 0.5, weightedScore: 0, explanation: "Sin texto libre para comparar." };
  }

  const haystack = normalizeRecommendationText([
    candidate.name,
    candidate.sku ?? "",
    candidate.shortDescription ?? "",
    candidate.description ?? "",
    ...candidate.categories.flatMap((category) => [category.name, category.slug]),
    ...candidate.knowledge.flatMap((link) => [link.name, link.slug])
  ].join(" "));
  const matched = tokens.filter((token) => haystack.includes(token));
  const score = clamp01(matched.length / tokens.length);
  return {
    code: "text",
    score,
    weightedScore: 0,
    explanation: matched.length ? `Coincidencias de texto: ${matched.join(", ")}.` : "Sin coincidencias relevantes de texto."
  };
}

function scorePopularity(candidate: RecommendationCandidate): RecommendationFactor {
  const raw = Math.max(candidate.popularityScore, candidate.recommendationScore);
  const score = clamp01(raw > 1 ? raw / 100 : raw);
  return {
    code: "popularity",
    score,
    weightedScore: 0,
    explanation: score >= 0.7 ? "Producto con buena puntuación histórica." : "Puntuación histórica moderada o aún sin datos."
  };
}

export function scoreRecommendationCandidate(
  candidate: RecommendationCandidate,
  query: RecommendationQuery
): Omit<RecommendationItemResult, "rank"> {
  const weights = resolveWeights(query);
  const factors = [
    scoreKnowledge(candidate, query),
    scoreCategory(candidate, query),
    scoreBudget(candidate, query),
    scoreCustomizable(candidate, query),
    scoreText(candidate, query),
    scorePopularity(candidate)
  ].map((factor) => ({
    ...factor,
    weightedScore: factor.score * weights[factor.code]
  }));

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + Math.max(0, weight), 0) || 1;
  const score = roundScore(factors.reduce((sum, factor) => sum + factor.weightedScore, 0) / totalWeight);
  const price = choosePrice(candidate, query);
  const strongest = [...factors].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);

  return {
    productId: candidate.productId,
    name: candidate.name,
    sku: candidate.sku,
    score,
    price: price ? {
      amount: price.amount,
      currency: price.currency,
      minQuantity: price.minQuantity,
      maxQuantity: price.maxQuantity
    } : null,
    factors,
    explanation: strongest.map((factor) => factor.explanation).join(" ")
  };
}
