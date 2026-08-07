export interface RceProductSearchCriteria {
  readonly relationship?: string;
  readonly age?: number;
  readonly occasion?: string;
  readonly interests: readonly string[];
  readonly budgetMax?: number;
  readonly style?: readonly string[];
  readonly limit?: number;
}

export interface RceProductCandidate {
  readonly id: string;
  readonly title: string;
  readonly price?: number;
  readonly available?: boolean;
  readonly score?: number;
  readonly reasons?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RceRankedProductCandidate extends RceProductCandidate {
  readonly rank: number;
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface RceProductSearchResult {
  readonly criteria: RceProductSearchCriteria;
  readonly candidates: readonly RceProductCandidate[];
  readonly source: string;
  readonly durationMs: number;
  readonly generatedAt: string;
}

export interface RceProductRankingResult {
  readonly criteria: RceProductSearchCriteria;
  readonly ranked: readonly RceRankedProductCandidate[];
  readonly durationMs: number;
  readonly generatedAt: string;
}

export interface RceProductSearchPort {
  search(
    criteria: RceProductSearchCriteria,
  ): Promise<readonly RceProductCandidate[]>;
}

export interface RceProductRankingPort {
  rank(input: {
    readonly criteria: RceProductSearchCriteria;
    readonly candidates: readonly RceProductCandidate[];
  }): Promise<readonly RceRankedProductCandidate[]>;
}

export interface RceProductRuntimeMetrics {
  readonly searches: number;
  readonly cacheHits: number;
  readonly rankings: number;
  readonly supersededResults: number;
  readonly failures: number;
}
