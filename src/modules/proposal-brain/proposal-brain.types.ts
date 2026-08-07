export interface ProposalBrainCandidate {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly category?: string;
  readonly price?: number;
  readonly stock?: number;
  readonly score?: number;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly canonicalInterests?: readonly string[];
  readonly themes?: readonly string[];
  readonly materials?: readonly string[];
  readonly techniques?: readonly string[];
  readonly personalizationAvailable?: boolean;
  readonly marginPercent?: number;
  readonly bundleRoles?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ProposalBrainInput {
  readonly journeyId?: string;
  readonly recipientLabel?: string;
  readonly occasion?: string;
  readonly budget?: number;
  readonly interests?: readonly string[];
  readonly strategy?: string;
  readonly targetItemCount?: number;
  readonly confidence?: number;
  readonly candidates: readonly ProposalBrainCandidate[];
}
export interface CandidateScore {
  readonly candidate: ProposalBrainCandidate;
  readonly relevanceScore: number;
  readonly budgetScore: number;
  readonly personalizationScore: number;
  readonly stockScore: number;
  readonly commercialScore: number;
  readonly totalScore: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
}
export interface BudgetPlan {
  readonly totalBudget?: number;
  readonly heroBudget?: number;
  readonly complementsBudget?: number;
  readonly messageBudget?: number;
  readonly packagingBudget?: number;
}
export interface ProposalBrainDraft {
  readonly id: string;
  readonly title: string;
  readonly strategy: string;
  readonly candidateIds: readonly string[];
  readonly primaryCandidateId?: string;
  readonly estimatedPrice?: number;
  readonly withinBudget: boolean;
  readonly diversityScore: number;
  readonly score: number;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
}
export interface ProposalBrainTrace {
  readonly phase: "NORMALIZE"|"CANDIDATES"|"BUDGET"|"DIVERSITY"|"DRAFTS";
  readonly message: string;
  readonly data?: unknown;
}
export interface ProposalBrainResult {
  readonly generatedAt: string;
  readonly input: ProposalBrainInput;
  readonly budgetPlan: BudgetPlan;
  readonly rankedCandidates: readonly CandidateScore[];
  readonly drafts: readonly ProposalBrainDraft[];
  readonly diagnostics: {
    readonly inputCandidates: number;
    readonly rankedCandidates: number;
    readonly generatedDrafts: number;
  };
  readonly traces: readonly ProposalBrainTrace[];
}
