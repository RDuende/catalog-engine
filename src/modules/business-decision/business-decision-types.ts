import type { CanonicalProduct, ProviderOffer } from "../canonical-product/canonical-types.js";

export type BusinessDimension =
  | "margin"
  | "stock"
  | "delivery"
  | "supplier"
  | "affinity"
  | "sustainability"
  | "strategy";

export interface BusinessCandidate {
  product: CanonicalProduct;
  offer?: ProviderOffer;
  affinity?: number;
  sustainabilityScore?: number;
  sellingPrice?: number;
  unitProductionCost?: number;
  strategicTags?: string[];
}

export interface BusinessDecisionContext {
  quantity?: number;
  requiredDeliveryDays?: number;
  preferredProviders?: string[];
  sellingPrices?: Record<string, number>;
  unitProductionCosts?: Record<string, number>;
  strategicPriorities?: string[];
}

export interface BusinessScoreResult {
  dimension: BusinessDimension;
  score: number;
  weight: number;
  weightedScore: number;
  reasons: string[];
  metadata?: Record<string, unknown>;
}

export interface BusinessScorer {
  readonly dimension: BusinessDimension;
  score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult;
}

export interface BusinessStrategy {
  name: string;
  weights: Partial<Record<BusinessDimension, number>>;
  disabledDimensions?: BusinessDimension[];
  minimumScore?: number;
}

export interface BusinessDecisionResult {
  rank: number;
  product: CanonicalProduct;
  offer?: ProviderOffer;
  score: number;
  confidence: number;
  dimensions: BusinessScoreResult[];
  reasons: string[];
}

export interface BusinessDecisionRun {
  strategy: BusinessStrategy;
  results: BusinessDecisionResult[];
  rejected: Array<{ productId: string; reasons: string[] }>;
}
