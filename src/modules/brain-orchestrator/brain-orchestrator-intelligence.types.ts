import type {
  BrainOrchestratorInput,
} from "./brain-orchestrator.types.js";

export interface BrainIntelligenceInput
extends BrainOrchestratorInput {
  readonly conversationMessage?: string;
  readonly conversationState?: string;
  readonly hasCandidates?: boolean;
  readonly hasProposals?: boolean;
  readonly hasSelectedProduct?: boolean;
  readonly hasSelectedProposal?: boolean;
  readonly recipientMemorySubjectKey?: string;
  readonly forceProposalGeneration?: boolean;
}

export interface BrainIntelligenceContext {
  readonly intent?: unknown;
  readonly memory?: unknown;
  readonly emotion?: unknown;
  readonly conversation?: unknown;
  readonly orchestrator?: unknown;
}

export interface BrainIntelligenceStage {
  readonly id:
    | "INTENT"
    | "MEMORY"
    | "EMOTION"
    | "CONVERSATION"
    | "ORCHESTRATOR";
  readonly status:
    | "COMPLETE"
    | "SKIPPED"
    | "FAILED";
  readonly durationMs: number;
  readonly confidence?: number;
  readonly message: string;
  readonly input?: unknown;
  readonly output?: unknown;
}

export interface BrainIntelligenceResult {
  readonly generatedAt: string;
  readonly action:
    | "ASK"
    | "READY_TO_PROPOSE"
    | "PROPOSALS_READY"
    | "COMPOSED"
    | "RESET"
    | "DIRECT"
    | "FAILED";
  readonly confidence: number;
  readonly message: string;
  readonly executionMode: string;
  readonly executionOrder: readonly string[];
  readonly context: BrainIntelligenceContext;
  readonly stages: readonly BrainIntelligenceStage[];
}
