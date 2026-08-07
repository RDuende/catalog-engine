import type {
  RceProductRankingResult,
  RceProductSearchResult,
  RceProductSearchCriteria,
} from "./product-runtime.contracts.js";

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

export function productCriteriaKey(
  criteria: RceProductSearchCriteria,
): string {
  return JSON.stringify(stable(criteria));
}

export class RceProductRuntimeCache {
  readonly #search = new Map<string, RceProductSearchResult>();
  readonly #ranking = new Map<string, RceProductRankingResult>();

  getSearch(
    criteria: RceProductSearchCriteria,
  ): RceProductSearchResult | undefined {
    return this.#search.get(productCriteriaKey(criteria));
  }

  setSearch(result: RceProductSearchResult): void {
    this.#search.set(productCriteriaKey(result.criteria), result);
  }

  getRanking(
    criteria: RceProductSearchCriteria,
  ): RceProductRankingResult | undefined {
    return this.#ranking.get(productCriteriaKey(criteria));
  }

  setRanking(result: RceProductRankingResult): void {
    this.#ranking.set(productCriteriaKey(result.criteria), result);
  }

  clear(): void {
    this.#search.clear();
    this.#ranking.clear();
  }
}
