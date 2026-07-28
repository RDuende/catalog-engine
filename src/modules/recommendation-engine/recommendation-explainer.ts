import type { SemanticRecommendationScoreBreakdown } from "./recommendation-types.js";

export function explainRecommendation(productName: string, breakdown: SemanticRecommendationScoreBreakdown[]): string {
  const positive = breakdown.filter((item) => item.points > 0).sort((a, b) => b.points - a.points).slice(0, 5);
  if (!positive.length) return `${productName} es una alternativa disponible, aunque presenta poca afinidad con los criterios indicados.`;
  const reasons = positive.map((item) => item.label.toLowerCase());
  if (reasons.length === 1) return `Recomiendo ${productName} porque ${reasons[0]}.`;
  const last = reasons.pop();
  return `Recomiendo ${productName} porque ${reasons.join(", ")} y ${last}.`;
}
