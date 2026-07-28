import type {
  BusinessCandidate,
  BusinessDecisionContext,
  BusinessDecisionResult,
  BusinessDecisionRun,
  BusinessScorer,
  BusinessStrategy,
} from "./business-decision-types.js";
import { createDefaultBusinessScorers } from "./scorers.js";

export const BALANCED_BUSINESS_STRATEGY: BusinessStrategy = {
  name: "balanced",
  weights: { margin: 1.2, stock: 1.1, delivery: 1, supplier: 0.7, affinity: 1.4, sustainability: 0.6, strategy: 0.8 },
  minimumScore: 0,
};

export class BusinessDecisionEngine {
  constructor(private readonly scorers: BusinessScorer[] = createDefaultBusinessScorers()) {}

  evaluate(
    candidates: BusinessCandidate[],
    context: BusinessDecisionContext = {},
    strategy: BusinessStrategy = BALANCED_BUSINESS_STRATEGY,
  ): BusinessDecisionRun {
    const rejected: BusinessDecisionRun["rejected"] = [];
    const evaluated: Omit<BusinessDecisionResult, "rank">[] = [];

    for (const candidate of candidates) {
      const active = this.scorers.filter((scorer) => !strategy.disabledDimensions?.includes(scorer.dimension));
      const dimensions = active.map((scorer) => {
        const raw = scorer.score(candidate, context);
        const weight = strategy.weights[scorer.dimension] ?? 1;
        return { ...raw, weight, weightedScore: raw.score * weight };
      });
      const weightTotal = dimensions.reduce((sum, item) => sum + item.weight, 0);
      const score = weightTotal ? dimensions.reduce((sum, item) => sum + item.weightedScore, 0) / weightTotal : 0;
      if (score < (strategy.minimumScore ?? 0)) {
        rejected.push({ productId: candidate.product.id, reasons: [`Business Score ${score.toFixed(1)} inferior al mínimo`] });
        continue;
      }
      const known = dimensions.filter((item) => !item.reasons.some((reason) => reason.includes("no informado") || reason.includes("no calculable"))).length;
      evaluated.push({
        product: candidate.product,
        offer: candidate.offer,
        score: Math.round(score * 10) / 10,
        confidence: Math.round((known / Math.max(1, dimensions.length)) * 100),
        dimensions,
        reasons: dimensions.flatMap((item) => item.reasons).filter((reason, index, all) => all.indexOf(reason) === index),
      });
    }

    const results = evaluated
      .sort((a, b) => b.score - a.score || (a.offer?.price ?? Number.POSITIVE_INFINITY) - (b.offer?.price ?? Number.POSITIVE_INFINITY))
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { strategy, results, rejected };
  }

  register(scorer: BusinessScorer): BusinessDecisionEngine {
    return new BusinessDecisionEngine([...this.scorers.filter((item) => item.dimension !== scorer.dimension), scorer]);
  }
}
