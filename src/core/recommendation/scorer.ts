import type { AttributeType } from "../knowledge/model.js";
import { normalizeKey } from "../knowledge/registry.js";
import type {
  RecommendationCandidateContext,
  RecommendationCriteria,
  RecommendationEvidence,
  RecommendationScoreBreakdown,
  RecommendationWeights,
} from "./model.js";

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  text: 30,
  category: 20,
  attributes: 25,
  budget: 10,
  confidence: 10,
  personalization: 5,
};

export interface ScoredCandidate {
  breakdown: RecommendationScoreBreakdown;
  evidence: RecommendationEvidence[];
  matchedCategories: string[];
  matchedAttributes: Partial<Record<AttributeType, string[]>>;
}

export function scoreCandidate(candidate: RecommendationCandidateContext, criteria: RecommendationCriteria): ScoredCandidate {
  const weights = { ...DEFAULT_RECOMMENDATION_WEIGHTS, ...criteria.weights };
  const evidence: RecommendationEvidence[] = [];
  const requestedTokens = tokenize(criteria.query ?? "");
  const matchedTokens = requestedTokens.filter((token) => candidate.searchableText.includes(token));
  const textRatio = requestedTokens.length ? matchedTokens.length / requestedTokens.length : 0;
  const text = round(weights.text * textRatio);
  if (text > 0) evidence.push({ code: "TEXT_MATCH", label: "Coincide con la búsqueda", contribution: text, matchedValues: matchedTokens });

  const requestedCategories = (criteria.categories ?? []).map(normalizeKey);
  const matchedCategories = requestedCategories.filter((category) => candidate.categories.includes(category));
  const categoryRatio = requestedCategories.length ? matchedCategories.length / requestedCategories.length : 0;
  const category = round(weights.category * categoryRatio);
  if (category > 0) evidence.push({ code: "CATEGORY_MATCH", label: "Coincide con categorías solicitadas", contribution: category, matchedValues: matchedCategories });

  const matchedAttributes: Partial<Record<AttributeType, string[]>> = {};
  let requestedAttributeCount = 0;
  let matchedAttributeCount = 0;
  for (const [type, values] of Object.entries(criteria.attributes ?? {}) as Array<[AttributeType, string[]]>) {
    const requested = values.map(normalizeKey);
    requestedAttributeCount += requested.length;
    const available = candidate.attributes[type] ?? [];
    const matches = requested.filter((value) => available.includes(value));
    if (matches.length) matchedAttributes[type] = matches;
    matchedAttributeCount += matches.length;
  }
  const attributeRatio = requestedAttributeCount ? matchedAttributeCount / requestedAttributeCount : 0;
  const attributes = round(weights.attributes * attributeRatio);
  if (attributes > 0) {
    evidence.push({
      code: "ATTRIBUTE_MATCH",
      label: "Coincide con atributos solicitados",
      contribution: attributes,
      matchedValues: Object.values(matchedAttributes).flat(),
    });
  }

  const budget = criteria.maxPriceMinor !== undefined && candidate.product.priceMinor !== undefined ? weights.budget : 0;
  if (budget > 0) evidence.push({ code: "WITHIN_BUDGET", label: "Está dentro del presupuesto", contribution: budget });

  const confidence = round(weights.confidence * clamp(candidate.product.confidence));
  if (confidence >= weights.confidence * 0.75) evidence.push({ code: "HIGH_CONFIDENCE", label: "Información de catálogo con alta confianza", contribution: confidence });

  const personalization = criteria.personalization === true
    ? round(weights.personalization * clamp(candidate.personalizationScore))
    : 0;
  if (personalization > 0) evidence.push({ code: "PERSONALIZABLE", label: "Tiene potencial de personalización", contribution: personalization });

  const total = round(text + category + attributes + budget + confidence + personalization);
  return {
    breakdown: { text, category, attributes, budget, confidence, personalization, total },
    evidence,
    matchedCategories,
    matchedAttributes,
  };
}

function tokenize(value: string): string[] {
  return [...new Set(normalizeText(value).split(" ").filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))];
}

export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOP_WORDS = new Set(["para", "con", "por", "una", "uno", "unos", "unas", "los", "las", "del", "que", "quiero", "busco", "necesito"]);
function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }
function round(value: number): number { return Math.round(value * 100) / 100; }
