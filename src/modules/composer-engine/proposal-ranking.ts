import type {
  ComposerContext,
  GiftProposalScoreBreakdown,
} from "./composer-engine.types.js";

function clamp(value: number): number {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

export function calculateProposalScore(
  input: {
    readonly averageCandidateScore: number;
    readonly coherenceScore: number;
    readonly totalPrice: number;
    readonly available: boolean;
    readonly marginPercent?: number;
    readonly productionMinutes?: number;
    readonly personalizedCount: number;
    readonly itemCount: number;
  },
  context: ComposerContext,
): {
  readonly score: number;
  readonly breakdown:
    GiftProposalScoreBreakdown;
} {
  const relevance =
    clamp(input.averageCandidateScore);

  const coherence =
    clamp(input.coherenceScore);

  const budgetFit =
    context.budget === undefined
      ? 0.75
      : input.totalPrice <=
          context.budget
        ? clamp(
            1 -
              Math.abs(
                context.budget -
                  input.totalPrice,
              ) /
                Math.max(
                  context.budget,
                  1,
                ),
          )
        : clamp(
            1 -
              (
                input.totalPrice -
                context.budget
              ) /
                Math.max(
                  context.budget,
                  1,
                ),
          );

  const availability =
    input.available ? 1 : 0;

  const margin =
    input.marginPercent === undefined
      ? 0.5
      : clamp(
          input.marginPercent / 50,
        );

  const production =
    input.productionMinutes === undefined
      ? 0.7
      : clamp(
          1 -
            input.productionMinutes /
              (60 * 24 * 7),
        );

  const emotional =
    input.itemCount === 0
      ? 0
      : clamp(
          0.5 +
            (
              input.personalizedCount /
              input.itemCount
            ) *
              0.5,
        );

  const breakdown =
    Object.freeze({
      relevance,
      coherence,
      budgetFit,
      availability,
      margin,
      production,
      emotional,
    });

  const score =
    relevance * 0.24 +
    coherence * 0.2 +
    budgetFit * 0.18 +
    availability * 0.12 +
    margin * 0.08 +
    production * 0.06 +
    emotional * 0.12;

  return Object.freeze({
    score:
      Math.round(score * 1000) /
      1000,
    breakdown,
  });
}
