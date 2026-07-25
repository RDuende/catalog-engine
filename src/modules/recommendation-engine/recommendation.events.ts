import type { DomainEvent } from "../../core/events/domain-events.js";

export interface RecommendationCompletedPayload {
  readonly query: string;
  readonly totalCandidates: number;
  readonly returnedItems: number;
  readonly elapsedMs: number;
}

export function recommendationCompletedEvent(
  payload: RecommendationCompletedPayload
): DomainEvent<"recommendation.completed", RecommendationCompletedPayload> {
  return {
    id: globalThis.crypto.randomUUID(),
    name: "recommendation.completed",
    occurredAt: new Date(),
    payload
  };
}
