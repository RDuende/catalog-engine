import { performance } from "node:perf_hooks";

import type { RceTaskHandler } from "./task-runtime.contracts.js";
import type {
  RceProductRankingPort,
  RceProductRuntimeMetrics,
  RceProductSearchCriteria,
  RceProductSearchPort,
  RceProductSearchResult,
  RceProductRankingResult,
} from "./product-runtime.contracts.js";
import {
  productCriteriaKey,
  RceProductRuntimeCache,
} from "./product-runtime-cache.js";

function elapsed(start: number): number {
  return Number((performance.now() - start).toFixed(3));
}

function toStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function productCriteriaFromTaskInput(
  input: Readonly<Record<string, unknown>>,
): RceProductSearchCriteria {
  const age =
    typeof input["recipient.age"] === "number"
      ? input["recipient.age"]
      : undefined;

  const budgetMax =
    typeof input["budget.max"] === "number"
      ? input["budget.max"]
      : undefined;

  return Object.freeze({
    ...(typeof input["recipient.relationship"] === "string"
      ? { relationship: input["recipient.relationship"] }
      : {}),
    ...(typeof age === "number" ? { age } : {}),
    ...(typeof input["occasion.type"] === "string"
      ? { occasion: input["occasion.type"] }
      : {}),
    interests: toStringArray(input["recipient.interests"]),
    ...(typeof budgetMax === "number" ? { budgetMax } : {}),
    style: toStringArray(input["gift.style"]),
    limit: 50,
  });
}

export class RceProductRuntime {
  readonly #searchPort: RceProductSearchPort;
  readonly #rankingPort: RceProductRankingPort;
  readonly #cache: RceProductRuntimeCache;
  readonly #latestCriteriaByConversation = new Map<string, string>();
  #metrics: RceProductRuntimeMetrics = Object.freeze({
    searches: 0,
    cacheHits: 0,
    rankings: 0,
    supersededResults: 0,
    failures: 0,
  });

  constructor(input: {
    readonly searchPort: RceProductSearchPort;
    readonly rankingPort: RceProductRankingPort;
    readonly cache?: RceProductRuntimeCache;
  }) {
    this.#searchPort = input.searchPort;
    this.#rankingPort = input.rankingPort;
    this.#cache = input.cache ?? new RceProductRuntimeCache();
  }

  metrics(): RceProductRuntimeMetrics {
    return this.#metrics;
  }

  createSearchHandler(): RceTaskHandler {
    return async ({ task }) => {
      const criteria = productCriteriaFromTaskInput(task.input);
      const key = productCriteriaKey(criteria);

      this.#latestCriteriaByConversation.set(
        task.conversationId,
        key,
      );

      const cached = this.#cache.getSearch(criteria);
      if (cached) {
        this.#metrics = Object.freeze({
          ...this.#metrics,
          cacheHits: this.#metrics.cacheHits + 1,
        });

        return Object.freeze({
          kind: "PRODUCT_SEARCH",
          cached: true,
          result: cached,
        });
      }

      const start = performance.now();

      try {
        const candidates = await this.#searchPort.search(criteria);
        const result: RceProductSearchResult = Object.freeze({
          criteria,
          candidates: Object.freeze([...candidates]),
          source: this.#searchPort.constructor.name,
          durationMs: elapsed(start),
          generatedAt: new Date().toISOString(),
        });

        if (
          this.#latestCriteriaByConversation.get(task.conversationId) !==
          key
        ) {
          this.#metrics = Object.freeze({
            ...this.#metrics,
            supersededResults:
              this.#metrics.supersededResults + 1,
          });

          return Object.freeze({
            kind: "PRODUCT_SEARCH",
            cached: false,
            superseded: true,
            result,
          });
        }

        this.#cache.setSearch(result);
        this.#metrics = Object.freeze({
          ...this.#metrics,
          searches: this.#metrics.searches + 1,
        });

        return Object.freeze({
          kind: "PRODUCT_SEARCH",
          cached: false,
          superseded: false,
          result,
        });
      } catch (error) {
        this.#metrics = Object.freeze({
          ...this.#metrics,
          failures: this.#metrics.failures + 1,
        });
        throw error;
      }
    };
  }

  createRankingHandler(): RceTaskHandler {
    return async ({ task }) => {
      const criteria = productCriteriaFromTaskInput(task.input);
      const cached = this.#cache.getRanking(criteria);

      if (cached) {
        this.#metrics = Object.freeze({
          ...this.#metrics,
          cacheHits: this.#metrics.cacheHits + 1,
        });

        return Object.freeze({
          kind: "PRODUCT_RANKING",
          cached: true,
          result: cached,
        });
      }

      const searchResult = this.#cache.getSearch(criteria);

      if (!searchResult) {
        return Object.freeze({
          kind: "PRODUCT_RANKING",
          cached: false,
          skipped: true,
          reason: "No existe una búsqueda compatible en caché.",
        });
      }

      const start = performance.now();

      try {
        const ranked = await this.#rankingPort.rank({
          criteria,
          candidates: searchResult.candidates,
        });

        const result: RceProductRankingResult = Object.freeze({
          criteria,
          ranked: Object.freeze([...ranked]),
          durationMs: elapsed(start),
          generatedAt: new Date().toISOString(),
        });

        this.#cache.setRanking(result);
        this.#metrics = Object.freeze({
          ...this.#metrics,
          rankings: this.#metrics.rankings + 1,
        });

        return Object.freeze({
          kind: "PRODUCT_RANKING",
          cached: false,
          skipped: false,
          result,
        });
      } catch (error) {
        this.#metrics = Object.freeze({
          ...this.#metrics,
          failures: this.#metrics.failures + 1,
        });
        throw error;
      }
    };
  }
}
