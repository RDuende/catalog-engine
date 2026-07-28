import type { CanonicalProduct, ProviderOffer } from "../canonical-product/canonical-types.js";

export type RecommendationDimension =
  | "audience"
  | "occasion"
  | "style"
  | "value"
  | "use"
  | "season"
  | "sector"
  | "personalization"
  | "material"
  | "category"
  | "term";

export interface ProductDNA {
  productId: string;
  audiences: string[];
  occasions: string[];
  styles: string[];
  values: string[];
  uses: string[];
  seasons: string[];
  sectors: string[];
  personalization: string[];
  materials: string[];
  categories: string[];
  terms: string[];
  quality?: "economy" | "standard" | "premium";
  sustainabilityScore?: number;
}

export interface RecommendationProfile {
  query?: string;
  budget?: { min?: number; max?: number; currency?: string };
  quantity?: number;
  audiences?: string[];
  occasions?: string[];
  styles?: string[];
  values?: string[];
  uses?: string[];
  seasons?: string[];
  sectors?: string[];
  personalization?: string[];
  materials?: string[];
  categories?: string[];
  required?: Partial<Record<RecommendationDimension, string[]>>;
  excluded?: Partial<Record<RecommendationDimension, string[]>>;
  requireStock?: boolean;
  maxLeadTimeDays?: number;
  preferredProviders?: string[];
  preferredQuality?: ProductDNA["quality"];
  minimumSustainabilityScore?: number;
}

export interface RecommendationWeights {
  audience: number;
  occasion: number;
  style: number;
  value: number;
  use: number;
  season: number;
  sector: number;
  personalization: number;
  material: number;
  category: number;
  term: number;
  budget: number;
  availability: number;
  leadTime: number;
  preferredProvider: number;
  quality: number;
  sustainability: number;
}

export interface BusinessRules {
  weights?: Partial<RecommendationWeights>;
  preferredProviders?: string[];
  minimumScore?: number;
  limit?: number;
}

export interface SemanticRecommendationScoreBreakdown {
  key: string;
  label: string;
  points: number;
  matches?: string[];
}

export interface RecommendationResult {
  rank: number;
  product: CanonicalProduct;
  dna: ProductDNA;
  offer?: ProviderOffer;
  score: number;
  maximumPossibleScore: number;
  affinity: number;
  breakdown: SemanticRecommendationScoreBreakdown[];
  explanation: string;
}

export interface RecommendationRun {
  profile: RecommendationProfile;
  results: RecommendationResult[];
  rejected: Array<{ productId: string; reasons: string[] }>;
}
