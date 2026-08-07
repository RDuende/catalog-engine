import type {
  RceImageCriteria,
  RceImageRuntimeResult,
} from "./image-runtime.contracts.js";

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

export function imageCriteriaKey(
  criteria: RceImageCriteria,
): string {
  return JSON.stringify(stable(criteria));
}

export class RceImageRuntimeCache {
  readonly #results = new Map<string, RceImageRuntimeResult>();

  get(
    criteria: RceImageCriteria,
  ): RceImageRuntimeResult | undefined {
    return this.#results.get(imageCriteriaKey(criteria));
  }

  set(result: RceImageRuntimeResult): void {
    this.#results.set(imageCriteriaKey(result.criteria), result);
  }

  clear(): void {
    this.#results.clear();
  }
}
