import { performance } from "node:perf_hooks";

import type { RceTaskHandler } from "./task-runtime.contracts.js";
import {
  RceStoryRuntimeCache,
  storyCriteriaKey,
} from "./story-runtime-cache.js";
import type {
  RceStoryCriteria,
  RceStoryGenerationPort,
  RceStoryRuntimeMetrics,
  RceStoryRuntimeResult,
} from "./story-runtime.contracts.js";

function elapsed(start: number): number {
  return Number((performance.now() - start).toFixed(3));
}

function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function storyCriteriaFromTaskInput(
  input: Readonly<Record<string, unknown>>,
): RceStoryCriteria {
  return Object.freeze({
    ...(typeof input["recipient.relationship"] === "string"
      ? { relationship: input["recipient.relationship"] }
      : {}),
    ...(typeof input["recipient.age"] === "number"
      ? { age: input["recipient.age"] }
      : {}),
    ...(typeof input["occasion.type"] === "string"
      ? { occasion: input["occasion.type"] }
      : {}),
    interests: stringArray(input["recipient.interests"]),
    style: stringArray(input["gift.style"]),
    emotionalGoals: stringArray(input["gift.emotional_goals"]),
    ...(typeof input["recipient.count"] === "number"
      ? { recipientCount: input["recipient.count"] }
      : {}),
    limit: 3,
  });
}

export class RceStoryRuntime {
  readonly #port: RceStoryGenerationPort;
  readonly #cache: RceStoryRuntimeCache;
  readonly #latestCriteriaByConversation = new Map<string, string>();

  #metrics: RceStoryRuntimeMetrics = Object.freeze({
    generations: 0,
    cacheHits: 0,
    supersededResults: 0,
    failures: 0,
  });

  constructor(input: {
    readonly port: RceStoryGenerationPort;
    readonly cache?: RceStoryRuntimeCache;
  }) {
    this.#port = input.port;
    this.#cache = input.cache ?? new RceStoryRuntimeCache();
  }

  metrics(): RceStoryRuntimeMetrics {
    return this.#metrics;
  }

  createHandler(): RceTaskHandler {
    return async ({ task }) => {
      const criteria = storyCriteriaFromTaskInput(task.input);
      const key = storyCriteriaKey(criteria);

      this.#latestCriteriaByConversation.set(
        task.conversationId,
        key,
      );

      const cached = this.#cache.get(criteria);

      if (cached) {
        this.#metrics = Object.freeze({
          ...this.#metrics,
          cacheHits: this.#metrics.cacheHits + 1,
        });

        return Object.freeze({
          kind: "STORY_SEEDS",
          cached: true,
          superseded: false,
          result: cached,
        });
      }

      const start = performance.now();

      try {
        const seeds = await this.#port.generate(criteria);

        const result: RceStoryRuntimeResult = Object.freeze({
          criteria,
          seeds: Object.freeze([...seeds]),
          source: this.#port.constructor.name,
          durationMs: elapsed(start),
          generatedAt: new Date().toISOString(),
        });

        const superseded =
          this.#latestCriteriaByConversation.get(
            task.conversationId,
          ) !== key;

        if (superseded) {
          this.#metrics = Object.freeze({
            ...this.#metrics,
            supersededResults:
              this.#metrics.supersededResults + 1,
          });

          return Object.freeze({
            kind: "STORY_SEEDS",
            cached: false,
            superseded: true,
            result,
          });
        }

        this.#cache.set(result);
        this.#metrics = Object.freeze({
          ...this.#metrics,
          generations: this.#metrics.generations + 1,
        });

        return Object.freeze({
          kind: "STORY_SEEDS",
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
}
