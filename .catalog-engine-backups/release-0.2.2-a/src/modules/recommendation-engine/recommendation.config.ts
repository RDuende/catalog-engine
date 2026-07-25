import type { RecommendationWeights } from "./recommendation.types.js";

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  text: 0.24,
  knowledge: 0.30,
  category: 0.14,
  budget: 0.12,
  customization: 0.10,
  popularity: 0.07,
  featured: 0.03
};

export function normalizeRecommendationWeights(
  weights: Partial<RecommendationWeights> = {}
): RecommendationWeights {
  const merged: RecommendationWeights = {
    ...DEFAULT_RECOMMENDATION_WEIGHTS,
    ...weights
  };

  const total = Object.values(merged).reduce((sum, value) => sum + Math.max(0, value), 0);

  if (total <= 0) return DEFAULT_RECOMMENDATION_WEIGHTS;

  return {
    text: Math.max(0, merged.text) / total,
    knowledge: Math.max(0, merged.knowledge) / total,
    category: Math.max(0, merged.category) / total,
    budget: Math.max(0, merged.budget) / total,
    customization: Math.max(0, merged.customization) / total,
    popularity: Math.max(0, merged.popularity) / total,
    featured: Math.max(0, merged.featured) / total
  };
}
