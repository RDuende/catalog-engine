import type { JourneyFact, JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { JourneyQualityDimension, JourneyQualityReport } from "./journey-model.types.js";

function latest(snapshot: JourneyProjectSnapshot, key: string): JourneyFact | undefined {
  return [...snapshot.facts]
    .filter((fact) => fact.key === key && fact.value !== undefined && fact.value !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

function meaningful(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function confidence(snapshot: JourneyProjectSnapshot, key: string): number {
  const fact = latest(snapshot, key);
  return meaningful(fact?.value) ? Math.max(0, Math.min(1, fact?.confidence ?? 0)) : 0;
}

function best(snapshot: JourneyProjectSnapshot, keys: readonly string[]): number {
  return Math.max(0, ...keys.map((key) => confidence(snapshot, key)));
}

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

const DEFINITIONS = Object.freeze([
  { id: "recipient", label: "Destinatario", weight: 25, keys: ["recipient.relationship", "recipient.age", "recipient.name"], required: ["recipient.relationship"] },
  { id: "interests", label: "Intereses", weight: 20, keys: ["recipient.interests"], required: [] },
  { id: "budget", label: "Presupuesto", weight: 20, keys: ["budget.max"], required: [] },
  { id: "occasion", label: "Ocasión", weight: 15, keys: ["occasion.type", "occasion.date_text"], required: ["occasion.type"] },
  { id: "personalization", label: "Personalización", weight: 10, keys: ["personalization.enabled", "personalization.name", "personalization.photo_available", "personalization.phrase"], required: [] },
  { id: "delivery", label: "Plazo", weight: 5, keys: ["delivery.date_text", "occasion.date_text"], required: [] },
  { id: "style", label: "Estilo", weight: 5, keys: ["gift.style", "recipient.personality"], required: [] },
] as const);

export function evaluateJourneyQuality(snapshot: JourneyProjectSnapshot, now?: string): JourneyQualityReport {
  const dimensions: JourneyQualityDimension[] = DEFINITIONS.map((definition) => {
    const present = definition.keys.filter((key) => meaningful(latest(snapshot, key)?.value));
    const missing = definition.keys.filter((key) => !meaningful(latest(snapshot, key)?.value));
    let score: number;
    if (definition.id === "recipient") {
      score = average([
        confidence(snapshot, "recipient.relationship"),
        Math.max(confidence(snapshot, "recipient.age"), confidence(snapshot, "recipient.name") * 0.75),
      ]) * 100;
    } else if (definition.id === "occasion") {
      score = best(snapshot, definition.keys) * 100;
    } else if (definition.id === "personalization") {
      score = best(snapshot, definition.keys) * 100;
    } else if (definition.id === "delivery") {
      score = best(snapshot, definition.keys) * 100;
    } else {
      score = average(definition.keys.map((key) => confidence(snapshot, key))) * 100;
    }
    const bounded = Number(Math.max(0, Math.min(100, score)).toFixed(2));
    return Object.freeze({
      id: definition.id,
      label: definition.label,
      weight: definition.weight,
      score: bounded,
      weightedScore: Number((bounded * definition.weight / 100).toFixed(2)),
      status: bounded === 0 ? "EMPTY" : bounded < 70 ? "PARTIAL" : "STRONG",
      facts: Object.freeze(present),
      missing: Object.freeze(missing),
    });
  });

  const score = Number(dimensions.reduce((sum, dimension) => sum + dimension.weightedScore, 0).toFixed(2));
  const requiredKeys = DEFINITIONS.flatMap((definition) => [...definition.required]);
  const requiredComplete = requiredKeys.every((key) => meaningful(latest(snapshot, key)?.value));
  const missing = dimensions.flatMap((dimension) => dimension.missing);
  const strengths = dimensions.filter((dimension) => dimension.status === "STRONG").map((dimension) => dimension.id);

  return Object.freeze({
    score,
    requiredComplete,
    dimensions: Object.freeze(dimensions),
    missing: Object.freeze([...new Set(missing)]),
    strengths: Object.freeze(strengths),
    evaluatedAt: now ?? new Date().toISOString(),
  });
}
