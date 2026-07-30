import type { ParsedIntent } from "../intent/model.js";
import type { ResolvedSolution } from "../solution/model.js";
import type { RecommendationItemResult } from "../../modules/recommendation-engine/recommendation.types.js";

export type ConstraintSeverity = "hard" | "soft";
export type ConstraintStatus = "satisfied" | "violated" | "unknown";

export interface ReasoningConstraint {
  readonly code: "BUDGET" | "PERSONALIZATION" | "QUANTITY" | "DELIVERY";
  readonly severity: ConstraintSeverity;
  readonly expected: string | number | boolean;
  readonly description: string;
}

export interface ConstraintEvaluation {
  readonly constraint: ReasoningConstraint;
  readonly status: ConstraintStatus;
  readonly contribution: number;
  readonly explanation: string;
}

export interface ReasoningEvidence {
  readonly code: "BASE_RECOMMENDATION" | "SOLUTION_AFFINITY" | "KNOWLEDGE_MATCH" | "CONSTRAINT" | "CUSTOMIZATION";
  readonly contribution: number;
  readonly explanation: string;
}

export interface ReasonedRecommendation {
  readonly item: RecommendationItemResult;
  readonly originalScore: number;
  readonly reasoningScore: number;
  readonly finalScore: number;
  readonly eligible: boolean;
  readonly evidence: ReasoningEvidence[];
  readonly constraints: ConstraintEvaluation[];
  readonly explanation: string;
}

export interface ReasoningTrace {
  readonly version: "1.0";
  readonly intentSummary: string;
  readonly solution?: {
    readonly id: string;
    readonly name: string;
    readonly score: number;
  };
  readonly constraints: ReasoningConstraint[];
  readonly evaluatedCandidates: number;
  readonly rejectedCandidates: number;
  readonly decisions: ReasonedRecommendation[];
}

export interface ReasoningInput {
  readonly intent: ParsedIntent;
  readonly solution?: ResolvedSolution;
  readonly candidates: readonly RecommendationItemResult[];
}
