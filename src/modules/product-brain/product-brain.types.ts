export type ProductGiftRole = "PRIMARY" | "COMPLEMENT" | "BUNDLE_COMPONENT" | "PROMOTIONAL";

export interface ScoredTaxonomyValue {
  readonly id: string;
  readonly score: number;
  readonly evidence: readonly string[];
}

export interface ProductBrain {
  readonly productId: string;
  readonly version: string;
  readonly status: "READY" | "REVIEW_REQUIRED";
  readonly objectType: string;
  readonly giftRoles: readonly ProductGiftRole[];
  readonly interests: readonly ScoredTaxonomyValue[];
  /** Forma o motivo visual; no sustituye al objeto físico. */
  readonly shapes: readonly ScoredTaxonomyValue[];
  readonly occasions: readonly ScoredTaxonomyValue[];
  readonly recipientProfiles: readonly ScoredTaxonomyValue[];
  readonly emotionalGoals: readonly ScoredTaxonomyValue[];
  readonly personalizationScore: number;
  readonly personalizationMethods: readonly string[];
  readonly bundleScore: number;
  readonly premiumScore: number;
  readonly giftSuitabilityScore: number;
  readonly classificationConfidence: number;
  readonly searchTerms: readonly string[];
  readonly generatedAt: string;
}

export interface ProductBrainSource {
  readonly id: string;
  readonly providerKey: string;
  readonly name: string;
  readonly description?: string;
  readonly shortDescription?: string;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
  readonly material?: string;
  readonly customizable: boolean;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}
