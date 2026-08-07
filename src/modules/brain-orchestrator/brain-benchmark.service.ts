import {
  performance,
} from "node:perf_hooks";

import {
  defaultBrainOrchestrator,
} from "./brain-orchestrator.service.js";
import type {
  BrainBenchmarkResult,
  BrainOrchestratorInput,
} from "./brain-orchestrator.types.js";

function percentile(
  values: readonly number[],
  ratio: number,
): number {
  if (!values.length) return 0;

  const sorted =
    [...values].sort(
      (left, right) =>
        left - right,
    );

  const index =
    Math.min(
      sorted.length - 1,
      Math.max(
        0,
        Math.ceil(
          sorted.length *
            ratio,
        ) - 1,
      ),
    );

  return sorted[index] ?? 0;
}

export class BrainBenchmarkService {
  async run(
    input: BrainOrchestratorInput,
    runs = 10,
  ): Promise<BrainBenchmarkResult> {
    const safeRuns =
      Math.max(
        1,
        Math.min(100, runs),
      );

    const durations:
      number[] = [];

    const confidences:
      number[] = [];

    let successfulRuns = 0;
    let failedRuns = 0;

    for (
      let index = 0;
      index < safeRuns;
      index += 1
    ) {
      const started =
        performance.now();

      try {
        const result =
          await defaultBrainOrchestrator
            .run(input);

        durations.push(
          performance.now() -
            started,
        );

        confidences.push(
          result.decision
            .confidence,
        );

        if (
          result.decision
            .action ===
          "FAILED"
        ) {
          failedRuns += 1;
        } else {
          successfulRuns += 1;
        }
      } catch {
        durations.push(
          performance.now() -
            started,
        );
        failedRuns += 1;
      }
    }

    const avg =
      durations.reduce(
        (sum, value) =>
          sum + value,
        0,
      ) /
      Math.max(
        1,
        durations.length,
      );

    const avgConfidence =
      confidences.length
        ? confidences.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) /
          confidences.length
        : 0;

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      runs:
        safeRuns,
      successfulRuns,
      failedRuns,
      avgMs: avg,
      p50Ms:
        percentile(
          durations,
          0.5,
        ),
      p95Ms:
        percentile(
          durations,
          0.95,
        ),
      avgConfidence,
    });
  }
}

export const
  defaultBrainBenchmark =
    new BrainBenchmarkService();
