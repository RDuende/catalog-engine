import type { JourneyFact, JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { GiftModel } from "./journey-model.types.js";
import { evaluateJourneyQuality } from "./journey-quality-engine.js";
import { evaluateProposalReadiness } from "./proposal-readiness-engine.js";

function latest(snapshot: JourneyProjectSnapshot, key: string): JourneyFact | undefined {
  return [...snapshot.facts]
    .filter((fact) => fact.key === key && fact.value !== undefined && fact.value !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

function scalar<T>(snapshot: JourneyProjectSnapshot, key: string): T | undefined {
  return latest(snapshot, key)?.value as T | undefined;
}

function list(snapshot: JourneyProjectSnapshot, key: string): readonly string[] {
  const value = latest(snapshot, key)?.value;
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze([...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))]);
}

export function buildGiftModel(snapshot: JourneyProjectSnapshot, now?: string): GiftModel {
  const quality = evaluateJourneyQuality(snapshot, now);
  const readiness = evaluateProposalReadiness(quality);
  return Object.freeze({
    journeyId: snapshot.id,
    recipient: Object.freeze({
      count: scalar<number>(snapshot, "recipient.count"),
      name: scalar<string>(snapshot, "recipient.name"),
      age: scalar<number>(snapshot, "recipient.age"),
      relationship: scalar<string>(snapshot, "recipient.relationship"),
      interests: list(snapshot, "recipient.interests"),
      personality: list(snapshot, "recipient.personality"),
    }),
    occasion: Object.freeze({
      type: scalar<string>(snapshot, "occasion.type"),
      dateText: scalar<string>(snapshot, "occasion.date_text"),
    }),
    budget: Object.freeze({
      max: scalar<number>(snapshot, "budget.max"),
      currency: scalar<string>(snapshot, "budget.currency") ?? "EUR",
    }),
    personalization: Object.freeze({
      enabled: scalar<boolean>(snapshot, "personalization.enabled"),
      name: scalar<string>(snapshot, "personalization.name"),
      photoAvailable: scalar<boolean>(snapshot, "personalization.photo_available"),
      phrase: scalar<string>(snapshot, "personalization.phrase"),
    }),
    style: list(snapshot, "gift.style"),
    constraints: Object.freeze({
      deliveryText: scalar<string>(snapshot, "delivery.date_text"),
    }),
    quality,
    readiness,
    generatedAt: now ?? new Date().toISOString(),
  });
}
