import type { RecommendationCandidate, RecommendationContext, RecommendationEvaluation, RecommendationRule } from "./recommendation-core.types.js";

export class RecommendationEngine {
  constructor(private readonly rules: readonly RecommendationRule[]) {}
  evaluate(candidate: RecommendationCandidate, context: RecommendationContext): RecommendationEvaluation {
    const factors = this.rules.filter((rule) => rule.applies(context)).map((rule) => {
      const result = rule.evaluate(candidate, context);
      const weight = context.weights?.[result.category] ?? context.weights?.[result.ruleId] ?? 1;
      return { ...result, rawPoints: result.points, weight, points: Math.round(result.points * weight * 100) / 100 };
    });
    return {
      candidate,
      score: Math.max(0, Math.round(factors.reduce((total, factor) => total + factor.points, 0))),
      reasons: factors.flatMap((factor) => factor.reason ? [factor.reason] : []),
      warnings: factors.flatMap((factor) => factor.warning ? [factor.warning] : []),
      factors,
    };
  }
  rank(candidates: readonly RecommendationCandidate[], context: RecommendationContext, limit = 10): RecommendationEvaluation[] {
    return candidates.map((candidate) => this.evaluate(candidate, context))
      .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name, "es"))
      .slice(0, Math.max(1, limit));
  }
}
