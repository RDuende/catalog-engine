import type {
  RceProductCandidate,
  RceProductRankingPort,
  RceProductSearchCriteria,
  RceProductSearchPort,
  RceRankedProductCandidate,
} from "./product-runtime.contracts.js";

export interface SmartCatalogProductLike {
  readonly id: string;
  readonly name: string;
  readonly price?: number;
  readonly currency?: string;
  readonly active?: boolean;
  readonly stock?: number;
  readonly category?: string;
  readonly sku?: string;
  readonly productionDays?: number;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
}

export interface SmartCatalogRecommendationLike {
  readonly product: SmartCatalogProductLike;
  readonly score: number;
  readonly withinBudget?: boolean;
  readonly available?: boolean;
  readonly marginAmount?: number;
  readonly marginPercent?: number;
  readonly reasons?: readonly string[];
  readonly warnings?: readonly string[];
  readonly breakdown?: Readonly<Record<string, number>>;
}

export interface SmartCatalogContextLike {
  readonly interests?: readonly string[];
  readonly recipientAge?: number;
  readonly budget?: number;
  readonly visualStyle?: string;
  readonly emotionalGoals?: readonly string[];
  readonly requiredQuantity?: number;
  readonly maxProductionDays?: number;
}

export interface SmartCatalogServiceLike {
  recommend(
    context: SmartCatalogContextLike,
    limit?: number,
  ): Promise<readonly SmartCatalogRecommendationLike[]>;
}

function firstStyle(criteria: RceProductSearchCriteria): string | undefined {
  return criteria.style?.find((value) => value.trim().length > 0);
}

export function toSmartCatalogContext(
  criteria: RceProductSearchCriteria,
): SmartCatalogContextLike {
  return Object.freeze({
    ...(criteria.interests.length > 0
      ? { interests: Object.freeze([...criteria.interests]) }
      : {}),
    ...(typeof criteria.age === "number"
      ? { recipientAge: criteria.age }
      : {}),
    ...(typeof criteria.budgetMax === "number"
      ? { budget: criteria.budgetMax }
      : {}),
    ...(firstStyle(criteria)
      ? { visualStyle: firstStyle(criteria) }
      : {}),
    requiredQuantity: 1,
  });
}

function candidateFromRecommendation(
  item: SmartCatalogRecommendationLike,
): RceProductCandidate {
  const product = item.product;
  const image =
    product.imageUrl ??
    product.images?.find((value) => value.trim().length > 0);

  return Object.freeze({
    id: product.id,
    title: product.name,
    ...(typeof product.price === "number"
      ? { price: product.price }
      : {}),
    available:
      typeof item.available === "boolean"
        ? item.available
        : product.active !== false && (product.stock ?? 1) > 0,
    score: item.score,
    reasons: Object.freeze([
      ...(item.reasons ?? []),
      ...(item.warnings ?? []).map((warning) => `Aviso: ${warning}`),
    ]),
    metadata: Object.freeze({
      source: "smart-catalog",
      ...(product.sku ? { sku: product.sku } : {}),
      ...(product.category ? { category: product.category } : {}),
      ...(product.currency ? { currency: product.currency } : {}),
      ...(typeof product.stock === "number"
        ? { stock: product.stock }
        : {}),
      ...(typeof product.productionDays === "number"
        ? { productionDays: product.productionDays }
        : {}),
      ...(image ? { image } : {}),
      ...(typeof item.withinBudget === "boolean"
        ? { withinBudget: item.withinBudget }
        : {}),
      ...(typeof item.marginAmount === "number"
        ? { marginAmount: item.marginAmount }
        : {}),
      ...(typeof item.marginPercent === "number"
        ? { marginPercent: item.marginPercent }
        : {}),
      ...(item.breakdown ? { breakdown: item.breakdown } : {}),
    }),
  });
}

export class SmartCatalogProductSearchAdapter
  implements RceProductSearchPort
{
  readonly #service: SmartCatalogServiceLike;

  constructor(service: SmartCatalogServiceLike) {
    this.#service = service;
  }

  async search(
    criteria: RceProductSearchCriteria,
  ): Promise<readonly RceProductCandidate[]> {
    const recommendations = await this.#service.recommend(
      toSmartCatalogContext(criteria),
      criteria.limit ?? 50,
    );

    return Object.freeze(
      recommendations.map(candidateFromRecommendation),
    );
  }
}

function scoreOf(candidate: RceProductCandidate): number {
  return typeof candidate.score === "number"
    ? candidate.score
    : 0;
}

export class SmartCatalogProductRankingAdapter
  implements RceProductRankingPort
{
  async rank(input: {
    readonly criteria: RceProductSearchCriteria;
    readonly candidates: readonly RceProductCandidate[];
  }): Promise<readonly RceRankedProductCandidate[]> {
    const ranked = [...input.candidates]
      .filter((candidate) => candidate.available !== false)
      .sort((left, right) => {
        const scoreDifference =
          scoreOf(right) - scoreOf(left);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        const leftPrice =
          typeof left.price === "number"
            ? left.price
            : Number.POSITIVE_INFINITY;
        const rightPrice =
          typeof right.price === "number"
            ? right.price
            : Number.POSITIVE_INFINITY;

        return leftPrice - rightPrice ||
          left.id.localeCompare(right.id);
      })
      .map(
        (candidate, index): RceRankedProductCandidate =>
          Object.freeze({
            ...candidate,
            rank: index + 1,
            score: scoreOf(candidate),
            reasons: Object.freeze([
              ...(candidate.reasons ?? []),
              ...(typeof input.criteria.budgetMax === "number" &&
              typeof candidate.price === "number" &&
              candidate.price <= input.criteria.budgetMax
                ? ["Encaja en el presupuesto del Journey."]
                : []),
            ]),
          }),
      );

    return Object.freeze(ranked);
  }
}
