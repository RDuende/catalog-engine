import { randomUUID } from "node:crypto";
import {
  DEFAULT_COMMERCIAL_CONTEXT,
  isCommercialContext,
  type CommercialContext,
} from "../../../core/commercial-context/index.js";
import type {
  ConversationState,
  RaiActorContext,
  RaiContext,
  RaiProjectContext,
  RaiRuntimePorts,
  RaiIntentClassification,
} from "../contracts/index.js";
import { toRuntimeConversationState } from "./conversation-state-mapper.js";

export interface CreateRaiContextInput {
  readonly message: string;
  readonly sessionId: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly state?: ConversationState;
  readonly actor?: Partial<RaiActorContext>;
  readonly project?: RaiProjectContext;
  readonly facts?: CommercialContext;
  readonly history?: RaiContext["conversation"]["history"];
  readonly ports?: RaiRuntimePorts;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createRaiContext(input: CreateRaiContextInput): RaiContext {
  const requestId = input.requestId ?? randomUUID();
  const facts: CommercialContext = isCommercialContext(input.facts)
    ? { ...DEFAULT_COMMERCIAL_CONTEXT, ...input.facts }
    : { ...DEFAULT_COMMERCIAL_CONTEXT };

  return Object.freeze({
    requestId,
    correlationId: input.correlationId ?? requestId,
    causationId: input.causationId,
    actor: Object.freeze({
      role: input.actor?.role ?? "ANONYMOUS",
      actorId: input.actor?.actorId,
      locale: input.actor?.locale ?? "es-ES",
    }),
    session: Object.freeze({
      sessionId: input.sessionId,
      state: input.state ?? toRuntimeConversationState(facts.conversationState),
    }),
    project: input.project ? Object.freeze({ ...input.project }) : undefined,
    conversation: Object.freeze({
      message: input.message,
      history: input.history ? Object.freeze([...input.history]) : undefined,
      facts: Object.freeze({ ...facts }),
    }),
    ports: input.ports,
    metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
  });
}

export function withCommercialContext(
  context: RaiContext,
  facts: CommercialContext,
): RaiContext {
  return Object.freeze({
    ...context,
    session: Object.freeze({
      ...context.session,
      state: toRuntimeConversationState(facts.conversationState, context.session.state),
    }),
    conversation: Object.freeze({
      ...context.conversation,
      facts: Object.freeze({ ...facts }),
    }),
  });
}


export function withIntentClassification(
  context: RaiContext,
  intent: RaiIntentClassification,
): RaiContext {
  return Object.freeze({
    ...context,
    conversation: Object.freeze({
      ...context.conversation,
      intent,
    }),
  });
}
