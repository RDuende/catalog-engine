import type { RceConversationState } from "./contracts.js";

export interface JourneyFactInput {
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly source: "CONVERSATION";
  readonly evidence?: string;
  readonly now?: string;
}

export function rceStateToJourneyFacts(
  state: RceConversationState,
): readonly JourneyFactInput[] {
  return Object.freeze(
    Object.values(state.facts).map((fact) =>
      Object.freeze({
        key: fact.key,
        value: fact.value,
        confidence: fact.confidence,
        source: "CONVERSATION" as const,
        evidence: fact.evidence,
        now: fact.updatedAt,
      }),
    ),
  );
}
