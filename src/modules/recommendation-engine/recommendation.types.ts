export interface RecommendationRequest {
  readonly query: string;
  readonly limit?: number;
  readonly budget?: number;
  readonly quantity?: number;
  readonly currency?: string;
  readonly categorySlugs?: readonly string[];
  readonly knowledgeSlugs?: readonly string[];
  readonly customizable?: boolean;
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

export interface RecommendationItemResult {
  readonly productId: string;
  readonly sku: string | null;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly score: number;
  readonly unitPrice: number | null;
  readonly currency: string;
  readonly categories: readonly string[];
  readonly knowledge: readonly string[];
  readonly customizable: boolean;
  readonly reasons: readonly string[];
  readonly breakdown?: RecommendationScoreBreakdown;
}

export interface RecommendationResponse {
  readonly query: string;
  readonly totalCandidates: number;
  readonly elapsedMs: number;
  readonly items: readonly RecommendationItemResult[];
}
