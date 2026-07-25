export interface RecommendationRequest {
  readonly query: string;
  readonly budget?: number;
  readonly quantity?: number;
  readonly currency?: string;
  readonly customizable?: boolean;
  readonly limit?: number;
  readonly debug?: boolean;
}

export interface RecommendationScoreBreakdown {
  readonly text: number;
  readonly categories: number;
  readonly knowledge: number;
  readonly budget: number;
  readonly customizable: number;
  readonly popularity: number;
}

export interface RecommendationItem {
  readonly productId: string;
  readonly sku: string | null;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly imageUrl: string | null;
  readonly price: { readonly amount: number; readonly currency: string } | null;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly breakdown?: RecommendationScoreBreakdown;
}

export interface RecommendationResponse {
  readonly query: string;
  readonly normalizedTerms: readonly string[];
  readonly evaluated: number;
  readonly durationMs: number;
  readonly items: readonly RecommendationItem[];
}
