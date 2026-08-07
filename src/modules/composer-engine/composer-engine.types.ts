export type ProposalItemRole =
  | "HERO"
  | "CORE"
  | "COMPLEMENT"
  | "PACKAGING"
  | "MESSAGE"
  | "OPTIONAL";

export interface ComposerCandidate {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly canonicalInterests?: readonly string[];
  readonly themes?: readonly string[];
  readonly materials?: readonly string[];
  readonly techniques?: readonly string[];
  readonly price: number;
  readonly cost?: number;
  readonly stock?: number;
  readonly productionMinutes?: number;
  readonly personalizationAvailable?: boolean;
  readonly marginAmount?: number;
  readonly marginPercent?: number;
  readonly score?: number;
  readonly compatibleWith?: readonly string[];
  readonly incompatibleWith?: readonly string[];
  readonly requiredWith?: readonly string[];
  readonly bundleRoles?: readonly ProposalItemRole[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ComposerContext {
  readonly journeyId: string;
  readonly ownerId: string;
  readonly interests?: readonly string[];
  readonly themes?: readonly string[];
  readonly preferredMaterials?: readonly string[];
  readonly rejectedProductIds?: readonly string[];
  readonly selectedProductIds?: readonly string[];
  readonly budget?: number;
  readonly recipientCount?: number;
  readonly occasion?: string;
  readonly emotionalTone?: string;
  readonly maxItems?: number;
  readonly minItems?: number;
  readonly currency?: string;
}

export interface GiftProposalItem {
  readonly productId: string;
  readonly sku?: string;
  readonly name: string;
  readonly role: ProposalItemRole;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly cost?: number;
  readonly marginAmount?: number;
  readonly personalizationAvailable: boolean;
  readonly mandatory: boolean;
  readonly compatibilityScore: number;
  readonly reasons: readonly string[];
}

export interface GiftProposalAlternative {
  readonly replacedProductId: string;
  readonly alternativeProductId: string;
  readonly reason: string;
}

export interface GiftProposalScoreBreakdown {
  readonly relevance: number;
  readonly coherence: number;
  readonly budgetFit: number;
  readonly availability: number;
  readonly margin: number;
  readonly production: number;
  readonly emotional: number;
}

export interface GiftProposal {
  readonly id: string;
  readonly journeyId: string;
  readonly title: string;
  readonly story: string;
  readonly reason: string;
  readonly items: readonly GiftProposalItem[];
  readonly alternatives: readonly GiftProposalAlternative[];
  readonly subtotal: number;
  readonly totalPrice: number;
  readonly totalCost?: number;
  readonly marginAmount?: number;
  readonly marginPercent?: number;
  readonly currency: string;
  readonly score: number;
  readonly scoreBreakdown: GiftProposalScoreBreakdown;
  readonly withinBudget: boolean;
  readonly available: boolean;
  readonly estimatedProductionMinutes?: number;
  readonly previewStatus:
    | "NOT_REQUESTED"
    | "PENDING"
    | "READY"
    | "FAILED";
  readonly createdAt: string;
  readonly version: "1.0";
}

export interface ComposerOptions {
  readonly maxProposals?: number;
  readonly maxAlternativesPerItem?: number;
  readonly minimumCandidateScore?: number;
  readonly now?: string;
}

export interface ComposerResult {
  readonly proposals: readonly GiftProposal[];
  readonly discardedCandidateIds: readonly string[];
  readonly diagnostics: {
    readonly candidateCount: number;
    readonly eligibleCount: number;
    readonly bundleCount: number;
    readonly withinBudgetCount: number;
  };
}
