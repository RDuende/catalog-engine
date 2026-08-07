export type SmartProductCategory = string;

export type SmartProductGiftRole =
  | "PRIMARY"
  | "COMPLEMENT"
  | "BUNDLE_COMPONENT"
  | "PROMOTIONAL";

export interface SmartProductBrainInterest {
  readonly id: string;
  readonly score: number;
  readonly evidence?: readonly string[];
}

export interface SmartProductBrainShape {
  readonly id: string;
  readonly score: number;
  readonly evidence?: readonly string[];
}

export interface SmartProductBrain {
  readonly objectType: string;
  readonly giftRoles: readonly SmartProductGiftRole[];
  readonly interests: readonly SmartProductBrainInterest[];
  /**
   * Campo añadido en Product Brain v2. Es opcional para conservar compatibilidad
   * con perfiles v1 ya persistidos y fixtures antiguos.
   */
  readonly shapes?: readonly SmartProductBrainShape[];
  readonly personalizationScore: number;
  readonly bundleScore: number;
  readonly premiumScore: number;
  readonly giftSuitabilityScore: number;
  readonly classificationConfidence: number;
}

export interface SmartCatalogProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly providerKey?: string;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly category: SmartProductCategory;
  readonly price: number;
  readonly priceKnown?: boolean;
  readonly cost: number;
  readonly currency: string;
  readonly stock: number;
  readonly productionDays: number;
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly tags: readonly string[];
  readonly emotionalGoals: readonly string[];
  readonly visualStyles: readonly string[];
  readonly presentationTemplateIds: readonly string[];
  readonly active: boolean;

  /** Nombre canónico actual del perfil. */
  readonly productBrain?: SmartProductBrain;
  /** Alias legado mantenido durante la migración. */
  readonly brain?: SmartProductBrain;
}

export interface SmartCatalogContext {
  readonly budget?: number;
  readonly recipientAge?: number;
  readonly interests?: readonly string[];
  readonly canonicalInterests?: readonly string[];
  readonly canonicalInterestEvidence?: readonly {
    readonly interestId: string;
    readonly confidence: number;
    readonly source: string;
    readonly matchedTerms: readonly string[];
    readonly evidence: readonly string[];
    readonly taxonomyVersion: string;
  }[];
  readonly emotionalGoals?: readonly string[];
  readonly visualStyle?: string;
  readonly requiredQuantity?: number;
  readonly maxProductionDays?: number;
}

export interface SmartCatalogScoreBreakdown {
  readonly budget: number;
  readonly age: number;
  readonly interests: number;
  readonly emotion: number;
  readonly visual: number;
  readonly margin: number;
  readonly availability: number;
  readonly production: number;
  readonly giftSuitability: number;
  readonly personalization: number;
  readonly roleFit: number;
}

export interface SmartCatalogRecommendation {
  readonly product: SmartCatalogProduct;
  readonly score: number;
  readonly withinBudget: boolean;
  readonly available: boolean;
  readonly marginAmount: number;
  readonly marginPercent: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly breakdown: SmartCatalogScoreBreakdown;
}

export interface SmartCatalogRepository {
  list(context?: SmartCatalogContext): Promise<readonly SmartCatalogProduct[]>;
  getById(id: string): SmartCatalogProduct | undefined;
}


export type SmartCatalogDiscardReason =
  | "INACTIVE"
  | "UNAVAILABLE"
  | "AGE_MISMATCH"
  | "INTEREST_AFFINITY_TOO_LOW";

export interface SmartCatalogDiscardedProduct {
  readonly product: Pick<
    SmartCatalogProduct,
    "id" | "sku" | "name" | "active" | "stock" | "price" | "currency"
  >;
  readonly reason: SmartCatalogDiscardReason;
  readonly detail: string;
  readonly score: number;
  readonly breakdown: SmartCatalogScoreBreakdown;
}

export interface SmartCatalogDiagnostics {
  readonly catalogSize: number;
  readonly scopedCount: number;
  readonly activeCount: number;
  readonly availabilityAndAgeCount: number;
  readonly affinityCount: number;
  readonly selectedCount: number;
  readonly requiresInterestAffinity: boolean;
  readonly interestThreshold: number;
  readonly recommendations: readonly SmartCatalogRecommendation[];
  readonly discarded: readonly SmartCatalogDiscardedProduct[];
}
