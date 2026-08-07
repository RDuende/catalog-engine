export interface EnrichableCatalogProduct {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly interests?: readonly string[];
  readonly canonicalInterests?: readonly string[];
  readonly canonicalInterestEvidence?: readonly CanonicalInterestEvidence[];
  readonly productBrain?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export type CanonicalInterestSource =
  | "MANUAL"
  | "EXISTING_INTEREST"
  | "PRODUCT_TEXT"
  | "PRODUCT_BRAIN"
  | "KNOWLEDGE_BRAIN";

export interface CanonicalInterestEvidence {
  readonly interestId: string;
  readonly confidence: number;
  readonly source: CanonicalInterestSource;
  readonly matchedTerms: readonly string[];
  readonly evidence: readonly string[];
  readonly taxonomyVersion: "interest-brain-v1";
}

export interface EnrichedCatalogProduct
  extends EnrichableCatalogProduct {
  readonly canonicalInterests: readonly string[];
  readonly canonicalInterestEvidence:
    readonly CanonicalInterestEvidence[];
  readonly canonicalInterestEnrichment: {
    readonly version: "1.0";
    readonly taxonomyVersion: "interest-brain-v1";
    readonly enrichedAt: string;
    readonly automaticCount: number;
    readonly manualCount: number;
  };
}

export interface CatalogInterestEnrichmentOptions {
  readonly minimumConfidence?: number;
  readonly maxInterestsPerProduct?: number;
  readonly preserveManual?: boolean;
  readonly now?: string;
}

export interface CatalogInterestEnrichmentChange {
  readonly productId: string;
  readonly sku?: string;
  readonly name: string;
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly added: readonly string[];
  readonly evidence:
    readonly CanonicalInterestEvidence[];
}

export interface CatalogInterestCoverage {
  readonly totalProducts: number;
  readonly productsWithCanonicalInterests: number;
  readonly productsWithoutCanonicalInterests: number;
  readonly coveragePercent: number;
  readonly interestCounts:
    Readonly<Record<string, number>>;
  readonly domainCounts:
    Readonly<Record<string, number>>;
}

export interface CatalogInterestEnrichmentReport {
  readonly version: "1.0";
  readonly taxonomyVersion: "interest-brain-v1";
  readonly generatedAt: string;
  readonly totalProducts: number;
  readonly changedProducts: number;
  readonly unchangedProducts: number;
  readonly addedAssignments: number;
  readonly before: CatalogInterestCoverage;
  readonly after: CatalogInterestCoverage;
  readonly changes:
    readonly CatalogInterestEnrichmentChange[];
}
