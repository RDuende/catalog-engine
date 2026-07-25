export interface RecommendationQuery {
  readonly text: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly currency?: string;
  readonly quantity?: number;
  readonly budgetMin?: number;
  readonly budgetMax?: number;
  readonly categorySlugs?: readonly string[];
  readonly knowledgeNodeSlugs?: readonly string[];
  readonly customizationSlugs?: readonly string[];
  readonly customizableOnly?: boolean;
  readonly activeOnly?: boolean;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface RecommendationWeights {
  readonly text: number;
  readonly knowledge: number;
  readonly category: number;
  readonly budget: number;
  readonly customization: number;
  readonly popularity: number;
  readonly featured: number;
}

export interface RecommendationScoreFactor {
  readonly code:
    | "TEXT_MATCH"
    | "KNOWLEDGE_MATCH"
    | "CATEGORY_MATCH"
    | "BUDGET_MATCH"
    | "CUSTOMIZATION_MATCH"
    | "CUSTOMIZABLE"
    | "POPULARITY"
    | "FEATURED";
  readonly label: string;
  readonly score: number;
  readonly weight: number;
  readonly contribution: number;
  readonly evidence?: unknown;
}

export interface RecommendationCandidate {
  readonly id: string;
  readonly sku: string | null;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly status: string;
  readonly customizable: boolean;
  readonly featured: boolean;
  readonly popularityScore: number;
  readonly recommendationScore: number;
  readonly categories: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly isPrimary: boolean;
  }[];
  readonly knowledgeLinks: readonly {
    readonly nodeId: string;
    readonly nodeName: string;
    readonly nodeSlug: string;
    readonly nodeType: string;
    readonly relationType: string;
    readonly weight: number;
    readonly confidence: number;
    readonly explanation: string | null;
  }[];
  readonly customizations: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly type: string;
    readonly minQuantity: number | null;
    readonly maxQuantity: number | null;
  }[];
  readonly prices: readonly {
    readonly amount: number;
    readonly currency: string;
    readonly type: string;
    readonly minQuantity: number;
    readonly maxQuantity: number | null;
  }[];
}

export interface RecommendationProduct {
  readonly id: string;
  readonly sku: string | null;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly customizable: boolean;
  readonly featured: boolean;
  readonly selectedPrice: {
    readonly amount: number;
    readonly currency: string;
    readonly minQuantity: number;
    readonly maxQuantity: number | null;
  } | null;
  readonly categories: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly isPrimary: boolean;
  }[];
}

export interface RecommendationResultItem {
  readonly rank: number;
  readonly score: number;
  readonly product: RecommendationProduct;
  readonly factors: readonly RecommendationScoreFactor[];
  readonly reasons: readonly string[];
}

export interface RecommendationResult {
  readonly query: RecommendationQuery;
  readonly totalCandidates: number;
  readonly returned: number;
  readonly durationMs: number;
  readonly items: readonly RecommendationResultItem[];
}

export interface RecommendationCandidateRepository {
  findCandidates(query: RecommendationQuery): Promise<readonly RecommendationCandidate[]>;
}

export interface RecommendationEventPublisher {
  publish(event: import("../../core/events/domain-events.js").DomainEvent): Promise<void>;
}
