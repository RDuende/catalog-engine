import type { RecommendationEvidence } from "./model.js";

export function buildRecommendationReasons(evidence: RecommendationEvidence[]): string[] {
  const sorted = [...evidence].sort((a, b) => b.contribution - a.contribution);
  if (!sorted.length) return ["Producto válido con información suficiente para ser considerado."];
  return sorted.map((item) => {
    const values = item.matchedValues?.length ? `: ${item.matchedValues.join(", ")}` : "";
    return `${item.label}${values}.`;
  });
}
