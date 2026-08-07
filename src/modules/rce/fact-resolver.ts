import type { RceFact, RceFactCandidate, RceFactVersion } from "./contracts.js";

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? [...value] : value === undefined ? [] : [value];
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function resolveFact(
  current: RceFact | undefined,
  candidate: RceFactCandidate,
  now: string,
): RceFact | undefined {
  if (candidate.operation === "REMOVE") {
    if (!current) return undefined;
    const next = asList(current.value).filter((item) => !sameValue(item, candidate.value));
    if (sameValue(next, current.value)) return current;
    if (next.length === 0) return undefined;
    return Object.freeze({
      ...current,
      value: Object.freeze(next),
      confidence: candidate.confidence,
      sourceMessageId: candidate.sourceMessageId,
      evidence: candidate.evidence,
      inferred: candidate.inferred,
      updatedAt: now,
      history: Object.freeze([
        ...current.history,
        {
          value: current.value,
          confidence: current.confidence,
          sourceMessageId: current.sourceMessageId,
          changedAt: now,
          operation: candidate.operation,
        },
      ]),
    });
  }

  let nextValue = candidate.value;
  if (candidate.operation === "ADD") {
    const values = asList(current?.value);
    if (!values.some((item) => sameValue(item, candidate.value))) values.push(candidate.value);
    nextValue = Object.freeze(values);
  }

  if (current && sameValue(current.value, nextValue)) {
    return current.confidence >= candidate.confidence
      ? current
      : Object.freeze({ ...current, confidence: candidate.confidence, updatedAt: now });
  }

  const history: RceFactVersion[] = current
    ? [
        ...current.history,
        {
          value: current.value,
          confidence: current.confidence,
          sourceMessageId: current.sourceMessageId,
          changedAt: now,
          operation: candidate.operation,
        },
      ]
    : [];

  return Object.freeze({
    key: candidate.key,
    value: nextValue,
    confidence: candidate.confidence,
    sourceMessageId: candidate.sourceMessageId,
    evidence: candidate.evidence,
    inferred: candidate.inferred,
    updatedAt: now,
    history: Object.freeze(history),
  });
}
