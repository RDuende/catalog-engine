import type {
  RceStoryCriteria,
  RceStoryRuntimeResult,
} from "./story-runtime.contracts.js";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }

  return value;
}

export function storyCriteriaKey(
  criteria: RceStoryCriteria,
): string {
  return JSON.stringify(stable(criteria));
}

export class RceStoryRuntimeCache {
  readonly #results = new Map<string, RceStoryRuntimeResult>();

  get(
    criteria: RceStoryCriteria,
  ): RceStoryRuntimeResult | undefined {
    return this.#results.get(storyCriteriaKey(criteria));
  }

  set(result: RceStoryRuntimeResult): void {
    this.#results.set(storyCriteriaKey(result.criteria), result);
  }

  clear(): void {
    this.#results.clear();
  }
}
