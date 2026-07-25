import { randomUUID } from "node:crypto";
import type { DomainEvent } from "../../core/events/domain-events.js";

export type RecommendationCompletedEvent = DomainEvent<"recommendation.completed", {
  readonly totalCandidates: number;
  readonly returnedItems: number;
  readonly topScore: number | null;
}>;

export function recommendationCompletedEvent(payload: RecommendationCompletedEvent["payload"]): RecommendationCompletedEvent {
  return {
    id: randomUUID(),
    name: "recommendation.completed",
    occurredAt: new Date(),
    payload
  };
}
