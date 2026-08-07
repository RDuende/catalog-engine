import type {
  MemoryFact,
  MemoryFactInput,
} from "./memory-brain.types.js";
import {
  normalizeMemoryValue,
} from "./memory-normalizer.js";

const SINGLE_VALUE_KEYS = new Set<string>([
  "budget",
  "recipient-count",
]);

function isSingleValue(
  fact: MemoryFactInput,
): boolean {
  return (
    fact.kind === "AGE" ||
    SINGLE_VALUE_KEYS.has(fact.key)
  );
}

export function resolveFactConflict(
  currentFacts: readonly MemoryFact[],
  incoming: MemoryFactInput,
): {
  readonly supersededFactIds: readonly string[];
  readonly duplicateFactId?: string;
} {
  const normalized =
    normalizeMemoryValue(incoming.value);

  const sameKey = currentFacts.filter(
    (fact) =>
      fact.key === incoming.key &&
      fact.status !== "SUPERSEDED" &&
      fact.status !== "REJECTED",
  );

  const duplicate = sameKey.find(
    (fact) =>
      fact.normalizedValue === normalized,
  );

  if (duplicate) {
    return Object.freeze({
      supersededFactIds: Object.freeze([]),
      duplicateFactId: duplicate.id,
    });
  }

  if (!isSingleValue(incoming)) {
    return Object.freeze({
      supersededFactIds: Object.freeze([]),
    });
  }

  return Object.freeze({
    supersededFactIds: Object.freeze(
      sameKey.map((fact) => fact.id),
    ),
  });
}
