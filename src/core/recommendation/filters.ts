import type { RecommendationCandidateContext, RecommendationCriteria } from "./model.js";

export function isEligibleCandidate(candidate: RecommendationCandidateContext, criteria: RecommendationCriteria): boolean {
  const { product } = candidate;
  if ((criteria.validOnly ?? true) && !product.valid) return false;
  if (criteria.maxPriceMinor !== undefined && (product.priceMinor === undefined || product.priceMinor > criteria.maxPriceMinor)) return false;
  if (criteria.minConfidence !== undefined && product.confidence < criteria.minConfidence) return false;
  if (criteria.personalization === true && candidate.personalizationScore <= 0) return false;
  return true;
}
