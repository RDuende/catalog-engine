import type { AttributeType, ProductEntity } from "../knowledge/model.js";

export interface RecommendationWeights {
  text: number;
  category: number;
  attributes: number;
  budget: number;
  confidence: number;
  personalization: number;
}

export interface RecommendationCriteria {
  query?: string;
  categories?: string[];
  attributes?: Partial<Record<AttributeType, string[]>>;
  maxPriceMinor?: number;
  validOnly?: boolean;
  minConfidence?: number;
  personalization?: boolean;
  limit?: number;
  minimumScore?: number;
  weights?: Partial<RecommendationWeights>;
}

export interface RecommendationEvidence {
  code:
    | "TEXT_MATCH"
    | "CATEGORY_MATCH"
    | "ATTRIBUTE_MATCH"
    | "WITHIN_BUDGET"
    | "HIGH_CONFIDENCE"
    | "PERSONALIZABLE";
  label: string;
  contribution: number;
  matchedValues?: string[];
}

export interface RecommendationScoreBreakdown {
  text: number;
  category: number;
  attributes: number;
  budget: number;
  confidence: number;
  personalization: number;
  total: number;
}

export interface RecommendedProduct {
  product: ProductEntity;
  score: number;
  reasons: string[];
  evidence: RecommendationEvidence[];
  breakdown: RecommendationScoreBreakdown;
  matchedCategories: string[];
  matchedAttributes: Partial<Record<AttributeType, string[]>>;
}

export interface RecommendationResult {
  criteria: RecommendationCriteria;
  totalProducts: number;
  eligibleProducts: number;
  items: RecommendedProduct[];
}

export interface RecommendationCandidateContext {
  product: ProductEntity;
  categories: string[];
  attributes: Partial<Record<AttributeType, string[]>>;
  searchableText: string;
  personalizationScore: number;
}
