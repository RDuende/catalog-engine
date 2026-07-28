import type { CatalogKnowledgeData, ReferenceNode } from "../catalog-knowledge/knowledge-types.js";

export interface ProviderOfferInput {
  provider: string;
  reference: string;
  price?: number;
  currency?: string;
  stock?: number;
  leadTimeDays?: number;
  moq?: number;
  sourceFile?: string;
}

export interface ProviderOffer extends ProviderOfferInput {
  id: string;
  sourcePages: number[];
}

export interface CanonicalProduct {
  id: string;
  name: string;
  family?: string;
  categories: string[];
  materials: string[];
  terms: string[];
  variants: string[];
  offers: ProviderOffer[];
  sourceReferences: string[];
  confidence: number;
}

export interface CanonicalMatch {
  leftOfferId: string;
  rightOfferId: string;
  score: number;
  decision: "MERGED" | "REVIEW" | "REJECTED";
  reasons: string[];
}

export interface CanonicalCatalogData {
  version: "0.33.0";
  createdAt: string;
  products: Record<string, CanonicalProduct>;
  offerToProduct: Record<string, string>;
  matches: CanonicalMatch[];
}

export interface CanonicalBuildInput {
  knowledge: CatalogKnowledgeData;
  offers?: ProviderOfferInput[];
}

export interface CanonicalBuildOptions {
  mergeThreshold?: number;
  reviewThreshold?: number;
}

export interface BestOfferCriteria {
  quantity?: number;
  maxLeadTimeDays?: number;
  requireStock?: boolean;
  preferredProviders?: string[];
}

export interface CanonicalSearchResult {
  product: CanonicalProduct;
  score: number;
  reasons: string[];
}

export interface NormalizedReferenceProduct {
  knowledge: CatalogKnowledgeData;
  node: ReferenceNode;
  family?: string;
  offer: ProviderOffer;
  normalizedTerms: Set<string>;
  normalizedCategories: Set<string>;
  normalizedMaterials: Set<string>;
}
