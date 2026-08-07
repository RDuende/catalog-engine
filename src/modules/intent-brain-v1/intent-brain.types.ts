export type IntentPrimary =
  | "DISCOVER_GIFT"
  | "PERSONALIZE_PRODUCT"
  | "FIND_PRODUCT"
  | "BUILD_BUNDLE"
  | "REFINE_PROPOSAL"
  | "CHECK_PRICE"
  | "CHECK_AVAILABILITY"
  | "GET_INSPIRATION"
  | "MAKE_PROPOSALS"
  | "COMPARE_PROPOSALS"
  | "RESTART_GIFT"
  | "CONTINUE_GIFT"
  | "UNKNOWN";

export type IntentBrainTarget =
  | "CONVERSATION"
  | "MEMORY"
  | "EMOTION"
  | "INTEREST"
  | "GIFT"
  | "PRODUCT"
  | "PROPOSAL"
  | "COMPOSER"
  | "IMAGE";

export interface IntentEvidence {
  readonly text: string;
  readonly intent: IntentPrimary;
  readonly weight: number;
  readonly reason: string;
}

export interface IntentExecutionStep {
  readonly order: number;
  readonly brain: IntentBrainTarget;
  readonly required: boolean;
  readonly reason: string;
}

export interface IntentExecutionPlan {
  readonly mode:
    | "DISCOVERY"
    | "DIRECT"
    | "PROPOSAL"
    | "COMPARISON"
    | "UTILITY"
    | "RESET";
  readonly steps: readonly IntentExecutionStep[];
  readonly shouldAskQuestions: boolean;
  readonly shouldGenerateProposals: boolean;
  readonly shouldResetJourney: boolean;
}

export interface IntentBrainInput {
  readonly message: string;
  readonly conversationState?: string;
  readonly hasCandidates?: boolean;
  readonly hasProposals?: boolean;
  readonly hasSelectedProduct?: boolean;
  readonly hasSelectedProposal?: boolean;
  readonly facts?: Readonly<Record<string, unknown>>;
}

export interface IntentBrainResult {
  readonly generatedAt: string;
  readonly primaryIntent: IntentPrimary;
  readonly secondaryIntents: readonly IntentPrimary[];
  readonly confidence: number;
  readonly evidence: readonly IntentEvidence[];
  readonly executionPlan: IntentExecutionPlan;
  readonly explanation: string;
  readonly traces: readonly IntentTrace[];
}

export interface IntentTrace {
  readonly phase:
    | "NORMALIZE"
    | "EVIDENCE"
    | "RANK"
    | "PLAN"
    | "DECISION";
  readonly message: string;
  readonly data?: unknown;
}
