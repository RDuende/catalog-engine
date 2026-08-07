import type { ConversationState } from "./conversation-state.js";
import type { RaiIntentClassification } from "./intent-classification.js";

export interface RaiActorContext {
  readonly actorId?: string;
  readonly role: "ANONYMOUS" | "CUSTOMER" | "RECIPIENT" | "COLLABORATOR" | "STAFF" | "SYSTEM";
  readonly locale?: string;
}

export interface RaiSessionContext {
  readonly sessionId: string;
  readonly startedAt?: string;
  readonly state: ConversationState;
}

export interface RaiProjectContext {
  readonly projectId: string;
  readonly version?: number;
  readonly status?: string;
}

export interface RaiConversationContext {
  readonly message: string;
  readonly history?: readonly Readonly<{ role: "USER" | "RAI" | "SYSTEM"; content: string; at?: string }>[];
  readonly facts?: Readonly<Record<string, unknown>>;
  readonly intent?: RaiIntentClassification;
}

export interface RaiRuntimePorts {
  readonly capabilities?: unknown;
  readonly metrics?: unknown;
  readonly events?: unknown;
  readonly logger?: unknown;
}

export interface RaiContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly actor: RaiActorContext;
  readonly session: RaiSessionContext;
  readonly project?: RaiProjectContext;
  readonly conversation: RaiConversationContext;
  readonly ports?: RaiRuntimePorts;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
