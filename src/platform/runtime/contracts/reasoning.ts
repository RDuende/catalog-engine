import type { ConversationState } from "./conversation-state.js";
import type { Decision } from "./decision.js";
import type { NextAction } from "./next-action.js";
import type { RaiIntent } from "./intent-classification.js";

export interface ReasoningFacts {
  readonly intent: RaiIntent;
  readonly conversationState: ConversationState;
  readonly recipientKnown: boolean;
  readonly occasionKnown: boolean;
  readonly selectedProductKnown: boolean;
  readonly creativeSignalKnown: boolean;
  readonly imageAvailable: boolean;
  readonly projectAvailable: boolean;
  readonly missingFields: readonly string[];
  readonly values: Readonly<Record<string, unknown>>;
}

export interface ReasoningCandidate {
  readonly action: NextAction;
  readonly score: number;
  readonly policyId: string;
  readonly priority: number;
  readonly reasons: readonly {
    readonly code: string;
    readonly message: string;
    readonly evidence?: Readonly<Record<string, unknown>>;
  }[];
  readonly requiredCapabilities: readonly string[];
  readonly reply?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ReasoningTrace {
  readonly engineVersion: string;
  readonly facts: ReasoningFacts;
  readonly candidates: readonly ReasoningCandidate[];
  readonly selected: ReasoningCandidate;
  readonly decision: Decision;
}
