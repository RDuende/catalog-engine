import type {
  InterestBrainResult,
} from "./interest-brain.types.js";

export interface GiftBrainInterestContext {
  readonly primaryInterest?: string;
  readonly canonicalInterests:
    readonly string[];
  readonly confidence: number;
  readonly clusters:
    readonly {
      readonly key: string;
      readonly score: number;
      readonly confidence: number;
    }[];
}

export interface ProductBrainInterestContext {
  readonly interests:
    readonly {
      readonly canonical: string;
      readonly weight: number;
      readonly confidence: number;
      readonly source: string;
    }[];
}

export interface ProposalBrainInterestContext {
  readonly primaryInterest?: string;
  readonly canonicalInterests:
    readonly string[];
  readonly interestConfidence: number;
  readonly interestWeights:
    Readonly<Record<string, number>>;
}

export function interestContextForGiftBrain(
  result: InterestBrainResult,
): GiftBrainInterestContext {
  return Object.freeze({
    ...(result.primaryInterest
      ? {
          primaryInterest:
            result.primaryInterest,
        }
      : {}),
    canonicalInterests:
      result.canonicalInterests,
    confidence:
      result.confidence,
    clusters:
      Object.freeze(
        result.clusters.map(
          (cluster) =>
            Object.freeze({
              key:
                cluster.key,
              score:
                cluster.score,
              confidence:
                cluster.confidence,
            }),
        ),
      ),
  });
}

export function interestContextForProductBrain(
  result: InterestBrainResult,
): ProductBrainInterestContext {
  return Object.freeze({
    interests:
      Object.freeze(
        result.signals.map(
          (signal) =>
            Object.freeze({
              canonical:
                signal.canonical,
              weight:
                signal.weight,
              confidence:
                signal.confidence,
              source:
                signal.source,
            }),
        ),
      ),
  });
}

export function interestContextForProposalBrain(
  result: InterestBrainResult,
): ProposalBrainInterestContext {
  const interestWeights:
    Record<string, number> =
    {};

  for (const signal of result.signals) {
    interestWeights[
      signal.canonical
    ] =
      Math.max(
        interestWeights[
          signal.canonical
        ] ?? 0,
        signal.weight *
          signal.confidence,
      );
  }

  return Object.freeze({
    ...(result.primaryInterest
      ? {
          primaryInterest:
            result.primaryInterest,
        }
      : {}),
    canonicalInterests:
      result.canonicalInterests,
    interestConfidence:
      result.confidence,
    interestWeights:
      Object.freeze(
        interestWeights,
      ),
  });
}
