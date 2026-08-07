import type {
  RceConversationState,
  RceFact,
  RceMessage,
  RceProcessResult,
} from "./contracts.js";
import {
  createConversationState,
  RaiConversationEngine,
} from "./engine.js";

export interface JourneyFactLike {
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly source?: string;
  readonly evidence?: string;
  readonly updatedAt?: string;
}

export interface JourneyLike {
  readonly id: string;
  readonly facts: readonly JourneyFactLike[];
}

export interface JourneyFactInput {
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly source: "CONVERSATION";
  readonly evidence?: string;
  readonly now?: string;
}

export interface RceJourneyBridgeResult {
  readonly process: RceProcessResult;
  readonly factsToApply: readonly JourneyFactInput[];
  readonly skippedKeys: readonly string[];
}

function latestFacts(
  facts: readonly JourneyFactLike[],
): Readonly<Record<string, JourneyFactLike>> {
  const result: Record<string, JourneyFactLike> = {};

  for (const fact of facts) {
    const previous = result[fact.key];

    if (
      !previous ||
      String(previous.updatedAt ?? "") <= String(fact.updatedAt ?? "")
    ) {
      result[fact.key] = fact;
    }
  }

  return Object.freeze(result);
}

function journeyFactToRceFact(
  fact: JourneyFactLike,
  conversationId: string,
  now: string,
): RceFact {
  return Object.freeze({
    key: fact.key,
    value: fact.value,
    confidence: fact.confidence,
    sourceMessageId: `journey:${conversationId}`,
    evidence: fact.evidence ?? "Hecho existente del Journey",
    inferred: fact.source === "SYSTEM",
    updatedAt: fact.updatedAt ?? now,
    history: Object.freeze([]),
  });
}

export function journeyToRceState(
  journey: JourneyLike,
  now = new Date().toISOString(),
): RceConversationState {
  const state = createConversationState(journey.id, now);
  const facts: Record<string, RceFact> = {};

  for (const fact of Object.values(latestFacts(journey.facts))) {
    if (
      fact.key.startsWith("journey.") ||
      fact.key.startsWith("discovery.") ||
      fact.key.startsWith("conversation.")
    ) {
      continue;
    }

    facts[fact.key] = journeyFactToRceFact(fact, journey.id, now);
  }

  return Object.freeze({
    ...state,
    facts: Object.freeze(facts),
  });
}

function shouldApply(
  existing: JourneyFactLike | undefined,
  next: RceFact,
): boolean {
  if (!existing) {
    return true;
  }

  if (JSON.stringify(existing.value) === JSON.stringify(next.value)) {
    return next.confidence > existing.confidence;
  }

  return next.confidence >= existing.confidence;
}

export class RceJourneyBridge {
  readonly #engine = new RaiConversationEngine();

  process(input: {
    readonly journey: JourneyLike;
    readonly messageId: string;
    readonly text: string;
    readonly now?: string;
  }): RceJourneyBridgeResult {
    const now = input.now ?? new Date().toISOString();
    const before = latestFacts(input.journey.facts);
    const previousState = journeyToRceState(input.journey, now);

    const message: RceMessage = Object.freeze({
      id: input.messageId,
      role: "USER",
      text: input.text,
      createdAt: now,
    });

    const process = this.#engine.process(previousState, message);
    const factsToApply: JourneyFactInput[] = [];
    const skippedKeys: string[] = [];

    for (const key of process.changedKeys) {
      const fact = process.state.facts[key];

      if (!fact) {
        skippedKeys.push(key);
        continue;
      }

      if (!shouldApply(before[key], fact)) {
        skippedKeys.push(key);
        continue;
      }

      factsToApply.push(
        Object.freeze({
          key: fact.key,
          value: fact.value,
          confidence: fact.confidence,
          source: "CONVERSATION",
          evidence: fact.evidence,
          now: fact.updatedAt,
        }),
      );
    }

    return Object.freeze({
      process,
      factsToApply: Object.freeze(factsToApply),
      skippedKeys: Object.freeze(skippedKeys),
    });
  }
}
