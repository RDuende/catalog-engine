import type { ProductBrain, ProductGiftRole, ScoredTaxonomyValue } from "../product-brain/product-brain.types.js";

export interface ProductBrainCorrection {
  readonly objectType?: string;
  readonly giftRoles?: readonly ProductGiftRole[];
  readonly interests?: readonly ScoredTaxonomyValue[];
  readonly shapes?: readonly ScoredTaxonomyValue[];
  readonly personalizationMethods?: readonly string[];
  readonly personalizationScore?: number;
  readonly bundleScore?: number;
  readonly premiumScore?: number;
  readonly giftSuitabilityScore?: number;
  readonly notes?: string;
}

export interface ProductBrainHistoryEntry {
  readonly id: string;
  readonly productId: string;
  readonly action: "TEACH" | "REVERT";
  readonly before: ProductBrain;
  readonly after: ProductBrain;
  readonly correction: ProductBrainCorrection;
  readonly actor: string;
  readonly createdAt: string;
}

export interface ProductBrainStudioPreview {
  readonly before: ProductBrain;
  readonly after: ProductBrain;
  readonly changes: readonly string[];
  readonly reviewReasons: readonly string[];
}
