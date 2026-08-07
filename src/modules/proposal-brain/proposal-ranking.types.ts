import type {
  CandidateScore,
  ProposalBrainDraft,
} from "./proposal-brain.types.js";

export interface RankingWeights {
  readonly relevance: number;
  readonly budget: number;
  readonly personalization: number;
  readonly stock: number;
  readonly commercial: number;
  readonly diversity: number;
  readonly emotional: number;
  readonly novelty: number;
  readonly production: number;
  readonly visualQuality: number;
  readonly compatibility: number;
}

export interface RankedProposalCandidate extends CandidateScore {
  readonly emotionalScore: number;
  readonly noveltyScore: number;
  readonly productionScore: number;
  readonly visualQualityScore: number;
  readonly compatibilityScore: number;
  readonly weightedScore: number;
}

export interface BundleComponent {
  readonly productId: string;
  readonly role:
    | "HERO"
    | "CORE"
    | "COMPLEMENT"
    | "MESSAGE"
    | "PACKAGING"
    | "OPTIONAL";
  readonly reason: string;
}

export interface OptimizedBundle {
  readonly id: string;
  readonly components: readonly BundleComponent[];
  readonly candidateIds: readonly string[];
  readonly totalPrice?: number;
  readonly withinBudget: boolean;
  readonly diversityScore: number;
  readonly compatibilityScore: number;
  readonly emotionalScore: number;
  readonly commercialScore: number;
  readonly finalScore: number;
}

export interface ConfidenceFactor {
  readonly key: string;
  readonly label: string;
  readonly impact: number;
  readonly reason: string;
}

export interface ConfidenceBreakdown {
  readonly score: number;
  readonly factors: readonly ConfidenceFactor[];
  readonly summary: string;
}

export interface ProposalExplanation {
  readonly short: string;
  readonly detailed: string;
  readonly strengths: readonly string[];
  readonly risks: readonly string[];
}

export interface EnhancedProposalDraft extends ProposalBrainDraft {
  readonly optimizedBundle?: OptimizedBundle;
  readonly rankingScore: number;
  readonly confidenceBreakdown: ConfidenceBreakdown;
  readonly explanation: ProposalExplanation;
}
