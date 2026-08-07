import { randomUUID } from "node:crypto";
import type {
  RceConversationState,
  RceEvent,
  RceFact,
  RceMessage,
  RceProcessResult,
} from "./contracts.js";
import { extractFacts } from "./fact-extractor.js";
import { resolveFact } from "./fact-resolver.js";
import { understandMessage } from "./message-understanding.js";

function event<T>(
  conversationId: string,
  type: RceEvent<T>["type"],
  payload: T,
  at: string,
): RceEvent<T> {
  return Object.freeze({
    id: randomUUID(),
    conversationId,
    type,
    at,
    payload,
  });
}

export function createConversationState(
  conversationId: string,
  now = new Date().toISOString(),
): RceConversationState {
  return Object.freeze({
    conversationId,
    facts: Object.freeze({}),
    requestedGoals: Object.freeze([]),
    events: Object.freeze([]),
    updatedAt: now,
  });
}

export class RaiConversationEngine {
  process(
    previous: RceConversationState,
    message: RceMessage,
  ): RceProcessResult {
    const at = message.createdAt;
    const understanding = understandMessage(message.text);
    const discoveredFacts = extractFacts({
      messageId: message.id,
      text: message.text,
      kind: understanding.kind,
    });

    const facts: Record<string, RceFact> = { ...previous.facts };
    const changedKeys: string[] = [];
    const newEvents: RceEvent[] = [
      event(previous.conversationId, "MESSAGE_RECEIVED", message, at),
      event(previous.conversationId, "MESSAGE_UNDERSTOOD", understanding, at),
    ];

    for (const candidate of discoveredFacts) {
      newEvents.push(event(previous.conversationId, "FACT_DISCOVERED", candidate, at));
      const before = facts[candidate.key];
      const resolved = resolveFact(before, candidate, at);

      if (!resolved) {
        if (before) {
          delete facts[candidate.key];
          changedKeys.push(candidate.key);
          newEvents.push(event(previous.conversationId, "FACT_REMOVED", { key: candidate.key }, at));
        }
        continue;
      }

      facts[candidate.key] = resolved;
      if (resolved !== before) {
        changedKeys.push(candidate.key);
        newEvents.push(event(previous.conversationId, "FACT_UPDATED", resolved, at));
      }
    }

    const goals = [...previous.requestedGoals];
    if (
      understanding.requestedGoal &&
      !goals.includes(understanding.requestedGoal)
    ) {
      goals.push(understanding.requestedGoal);
      newEvents.push(event(
        previous.conversationId,
        "GOAL_REQUESTED",
        understanding.requestedGoal,
        at,
      ));
    }

    const state: RceConversationState = Object.freeze({
      conversationId: previous.conversationId,
      facts: Object.freeze(facts),
      requestedGoals: Object.freeze(goals),
      events: Object.freeze([...previous.events, ...newEvents]),
      updatedAt: at,
    });

    return Object.freeze({
      state,
      understanding,
      discoveredFacts,
      changedKeys: Object.freeze([...new Set(changedKeys)]),
    });
  }
}
