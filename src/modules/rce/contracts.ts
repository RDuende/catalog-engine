export type RceMessageRole = "USER" | "RAI" | "SYSTEM";

export type RceMessageKind =
  | "INFORMATION"
  | "CORRECTION"
  | "NEGATION"
  | "REQUEST_PROPOSALS"
  | "FEEDBACK"
  | "UNKNOWN";

export type RceFactOperation = "SET" | "ADD" | "REMOVE" | "CONFIRM";

export interface RceMessage {
  readonly id: string;
  readonly role: RceMessageRole;
  readonly text: string;
  readonly createdAt: string;
}

export interface RceFactCandidate {
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly operation: RceFactOperation;
  readonly sourceMessageId: string;
  readonly evidence: string;
  readonly inferred: boolean;
}

export interface RceFactVersion {
  readonly value: unknown;
  readonly confidence: number;
  readonly sourceMessageId: string;
  readonly changedAt: string;
  readonly operation: RceFactOperation;
}

export interface RceFact {
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly sourceMessageId: string;
  readonly evidence: string;
  readonly inferred: boolean;
  readonly updatedAt: string;
  readonly history: readonly RceFactVersion[];
}

export type RceEventType =
  | "MESSAGE_RECEIVED"
  | "MESSAGE_UNDERSTOOD"
  | "FACT_DISCOVERED"
  | "FACT_UPDATED"
  | "FACT_REMOVED"
  | "GOAL_REQUESTED"
  | "STATE_UPDATED";

export interface RceEvent<T = unknown> {
  readonly id: string;
  readonly conversationId: string;
  readonly type: RceEventType;
  readonly at: string;
  readonly payload: T;
}

export interface RceUnderstanding {
  readonly kind: RceMessageKind;
  readonly confidence: number;
  readonly requestedGoal?: "GENERATE_PROPOSALS";
}

export interface RceConversationState {
  readonly conversationId: string;
  readonly facts: Readonly<Record<string, RceFact>>;
  readonly requestedGoals: readonly string[];
  readonly events: readonly RceEvent[];
  readonly updatedAt: string;
}

export interface RceProcessResult {
  readonly state: RceConversationState;
  readonly understanding: RceUnderstanding;
  readonly discoveredFacts: readonly RceFactCandidate[];
  readonly changedKeys: readonly string[];
}
