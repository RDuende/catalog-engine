export interface RecommendationWeights {
  readonly knowledge: number;
  readonly category: number;
  readonly budget: number;
  readonly customizable: number;
  readonly text: number;
  readonly popularity: number;
}

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  knowledge: 0.38,
  category: 0.18,
  budget: 0.16,
  customizable: 0.08,
  text: 0.12,
  popularity: 0.08
};

export interface RecommendationQuery {
  readonly text?: string;
  readonly knowledgeSlugs?: readonly string[];
  readonly categorySlugs?: readonly string[];
  readonly budgetMin?: number;
  readonly budgetMax?: number;
  readonly currency?: string;
  readonly quantity?: number;
  readonly customizable?: boolean;
  readonly limit?: number;
  readonly weights?: Partial<RecommendationWeights>;
}

export interface RecommendationCandidate {
  readonly productId: string;
  readonly name: string;
  readonly sku: string | null;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly customizable: boolean;
  readonly popularityScore: number;
  readonly recommendationScore: number;
  readonly categories: readonly { readonly name: string; readonly slug: string }[];
  readonly knowledge: readonly {
    readonly slug: string;
    readonly name: string;
    readonly weight: number;
    readonly confidence: number;
    readonly explanation: string | null;
  }[];
  readonly prices: readonly {
    readonly amount: number;
    readonly currency: string;
    readonly minQuantity: number;
    readonly maxQuantity: number | null;
    readonly type: string;
  }[];
}

export type RecommendationFactorCode =
  | "knowledge"
  | "category"
  | "budget"
  | "customizable"
  | "text"
  | "popularity";

export interface RecommendationFactor {
  readonly code: RecommendationFactorCode;
  readonly score: number;
  readonly weightedScore: number;
  readonly explanation: string;
}

export interface RecommendationItemResult {
  readonly rank: number;
  readonly productId: string;
  readonly name: string;
  readonly sku: string | null;
  readonly score: number;
  readonly price: {
    readonly amount: number;
    readonly currency: string;
    readonly minQuantity: number;
    readonly maxQuantity: number | null;
  } | null;
  readonly factors: readonly RecommendationFactor[];
  readonly explanation: string;
}

export interface RecommendationResult {
  readonly generatedAt: Date;
  readonly query: RecommendationQuery;
  readonly totalCandidates: number;
  readonly items: readonly RecommendationItemResult[];
}

export interface RecommendationCandidateRepository {
  findCandidates(query: RecommendationQuery): Promise<readonly RecommendationCandidate[]>;
}
