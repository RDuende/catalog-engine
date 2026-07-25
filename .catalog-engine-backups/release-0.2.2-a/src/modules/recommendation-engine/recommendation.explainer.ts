import type { RecommendationScoreFactor } from "./recommendation.types.js";

export function buildRecommendationReasons(
  factors: readonly RecommendationScoreFactor[],
  limit = 4
): readonly string[] {
  return factors
    .filter((factor) => factor.score > 0 && factor.contribution > 0)
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, Math.max(1, limit))
    .map((factor) => factor.label);
}
