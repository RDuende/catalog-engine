import { performance } from "node:perf_hooks";

import type { RceTaskHandler } from "./task-runtime.contracts.js";
import {
  imageCriteriaKey,
  RceImageRuntimeCache,
} from "./image-runtime-cache.js";
import type {
  RceImageCriteria,
  RceImagePreparationPort,
  RceImageRuntimeMetrics,
  RceImageRuntimeResult,
} from "./image-runtime.contracts.js";

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

function recordValue(
  value: unknown,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze({});
  }

  return Object.freeze({
    ...(value as Record<string, unknown>),
  });
}

export function imageCriteriaFromTaskInput(
  input: Readonly<Record<string, unknown>>,
): RceImageCriteria {
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
    productIds: stringArray(input["product.ids"]),
    storySeedIds: stringArray(input["story.seed_ids"]),
    personalization: recordValue(input["personalization"]),
    variantCount:
      typeof input["image.variant_count"] === "number"
        ? Math.max(1, Math.min(12, input["image.variant_count"]))
        : 3,
  });
}

export class RceImageRuntime {
  readonly #port: RceImagePreparationPort;
  readonly #cache: RceImageRuntimeCache;
  readonly #latestCriteriaByConversation = new Map<string, string>();

  #metrics: RceImageRuntimeMetrics = Object.freeze({
    preparations: 0,
    cacheHits: 0,
    supersededResults: 0,
    failures: 0,
  });

  constructor(input: {
    readonly port: RceImagePreparationPort;
    readonly cache?: RceImageRuntimeCache;
  }) {
    this.#port = input.port;
    this.#cache = input.cache ?? new RceImageRuntimeCache();
  }

  metrics(): RceImageRuntimeMetrics {
    return this.#metrics;
  }

  createHandler(): RceTaskHandler {
    return async ({ task }) => {
      const criteria = imageCriteriaFromTaskInput(task.input);
      const key = imageCriteriaKey(criteria);

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
          kind: "IMAGE_VARIANTS",
          cached: true,
          superseded: false,
          result: cached,
        });
      }

      const start = performance.now();

      try {
        const variants = await this.#port.prepare(criteria);

        const result: RceImageRuntimeResult = Object.freeze({
          criteria,
          variants: Object.freeze([...variants]),
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
            kind: "IMAGE_VARIANTS",
            cached: false,
            superseded: true,
            result,
          });
        }

        this.#cache.set(result);

        this.#metrics = Object.freeze({
          ...this.#metrics,
          preparations: this.#metrics.preparations + 1,
        });

        return Object.freeze({
          kind: "IMAGE_VARIANTS",
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
