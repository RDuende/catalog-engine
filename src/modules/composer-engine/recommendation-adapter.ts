import type {
  ComposerCandidate,
  ComposerContext,
  ComposerResult,
  ProposalItemRole,
} from "./composer-engine.types.js";
import {
  defaultComposerEngine,
} from "./composer-engine.service.js";

export interface RecommendationLike {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly price?: number;
  readonly score?: number;
  readonly available?: boolean;
  readonly stock?: number;
  readonly marginAmount?: number;
  readonly marginPercent?: number;
  readonly canonicalInterests?: readonly string[];
  readonly materials?: readonly string[];
  readonly themes?: readonly string[];
  readonly personalizationAvailable?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function recommendationToComposerCandidate(
  recommendation: RecommendationLike,
): ComposerCandidate {
  return Object.freeze({
    id: recommendation.id,
    ...(recommendation.sku
      ? {
          sku:
            recommendation.sku,
        }
      : {}),
    name: recommendation.name,
    price:
      recommendation.price ?? 0,
    score:
      recommendation.score ?? 0,
    ...(recommendation.stock !==
    undefined
      ? {
          stock:
            recommendation.stock,
        }
      : recommendation.available ===
        false
        ? { stock: 0 }
        : {}),
    ...(recommendation
      .marginAmount !== undefined
      ? {
          marginAmount:
            recommendation
              .marginAmount,
        }
      : {}),
    ...(recommendation
      .marginPercent !== undefined
      ? {
          marginPercent:
            recommendation
              .marginPercent,
        }
      : {}),
    canonicalInterests:
      recommendation
        .canonicalInterests,
    materials:
      recommendation.materials,
    themes:
      recommendation.themes,
    personalizationAvailable:
      recommendation
        .personalizationAvailable,
    metadata:
      recommendation.metadata,
    bundleRoles: Object.freeze([
      "CORE",
      "COMPLEMENT",
    ] satisfies ProposalItemRole[]),
  });
}

export function composeFromRecommendations(
  recommendations:
    readonly RecommendationLike[],
  context: ComposerContext,
): ComposerResult {
  return defaultComposerEngine.compose(
    recommendations.map(
      recommendationToComposerCandidate,
    ),
    context,
  );
}
