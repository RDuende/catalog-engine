import type {
  ProposalBrainInput,
} from "./proposal-brain.types.js";
import type {
  RankedProposalCandidate,
  RankingWeights,
} from "./proposal-ranking.types.js";
import {
  rankCandidates,
} from "./candidate-engine.js";

export const DEFAULT_RANKING_WEIGHTS:
  RankingWeights = Object.freeze({
    relevance: 0.24,
    budget: 0.12,
    personalization: 0.1,
    stock: 0.1,
    commercial: 0.08,
    diversity: 0.06,
    emotional: 0.1,
    novelty: 0.05,
    production: 0.05,
    visualQuality: 0.05,
    compatibility: 0.05,
  });

function clamp(value: number): number {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

function emotionalScore(
  input: ProposalBrainInput,
  interests: readonly string[] | undefined,
): number {
  if (!input.interests?.length) {
    return 0.55;
  }

  const set =
    new Set(interests ?? []);
  const matches =
    input.interests.filter(
      (interest) =>
        set.has(interest),
    ).length;

  return clamp(
    0.45 +
    matches * 0.16,
  );
}

function noveltyScore(
  metadata:
    Readonly<Record<string, unknown>> |
    undefined,
): number {
  const raw =
    metadata?.noveltyScore;

  return typeof raw === "number"
    ? clamp(raw)
    : 0.6;
}

function productionScore(
  metadata:
    Readonly<Record<string, unknown>> |
    undefined,
): number {
  const lead =
    metadata?.leadTimeDays;

  if (typeof lead !== "number") {
    return 0.7;
  }

  if (lead <= 2) return 1;
  if (lead <= 5) return 0.85;
  if (lead <= 10) return 0.65;
  return 0.35;
}

function visualQualityScore(
  imageUrl: string | undefined,
  images: readonly string[] | undefined,
): number {
  if (imageUrl) return 1;
  if (images?.length) return 0.85;
  return 0.35;
}

function compatibilityScore(
  roles: readonly string[] | undefined,
): number {
  if (!roles?.length) return 0.6;
  if (
    roles.some(
      (role) =>
        /HERO|CORE|COMPLEMENT|PACKAGING|MESSAGE/iu.test(
          role,
        ),
    )
  ) {
    return 0.9;
  }

  return 0.7;
}

export function rankProposalCandidatesV2(
  input: ProposalBrainInput,
  weights:
    RankingWeights =
      DEFAULT_RANKING_WEIGHTS,
): readonly RankedProposalCandidate[] {
  const base =
    rankCandidates(input);

  return Object.freeze(
    base
      .map(
        (
          item,
        ): RankedProposalCandidate => {
          const candidate =
            item.candidate;

          const emotion =
            emotionalScore(
              input,
              candidate.canonicalInterests,
            );

          const novelty =
            noveltyScore(
              candidate.metadata,
            );

          const production =
            productionScore(
              candidate.metadata,
            );

          const visual =
            visualQualityScore(
              candidate.imageUrl,
              candidate.images,
            );

          const compatibility =
            compatibilityScore(
              candidate.bundleRoles,
            );

          const weightedScore =
            item.relevanceScore *
              weights.relevance +
            item.budgetScore *
              weights.budget +
            item.personalizationScore *
              weights.personalization +
            item.stockScore *
              weights.stock +
            item.commercialScore *
              weights.commercial +
            emotion *
              weights.emotional +
            novelty *
              weights.novelty +
            production *
              weights.production +
            visual *
              weights.visualQuality +
            compatibility *
              weights.compatibility +
            0.8 *
              weights.diversity;

          return Object.freeze({
            ...item,
            emotionalScore:
              emotion,
            noveltyScore:
              novelty,
            productionScore:
              production,
            visualQualityScore:
              visual,
            compatibilityScore:
              compatibility,
            weightedScore:
              clamp(
                weightedScore,
              ),
          });
        },
      )
      .sort(
        (left, right) =>
          right.weightedScore -
          left.weightedScore,
      ),
  );
}
