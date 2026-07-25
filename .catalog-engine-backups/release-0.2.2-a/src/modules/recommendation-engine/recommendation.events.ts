import type { DomainEvent } from "../../core/events/domain-events.js";

function eventId(): string {
  return globalThis.crypto.randomUUID();
}

export interface RecommendationCompletedPayload {
  readonly query: string;
  readonly candidates: number;
  readonly results: number;
  readonly durationMs: number;
}

export function recommendationCompletedEvent(
  payload: RecommendationCompletedPayload
): DomainEvent<"recommendation.completed", RecommendationCompletedPayload> {
  return {
    id: eventId(),
    name: "recommendation.completed",
    occurredAt: new Date(),
    payload
  };
}
