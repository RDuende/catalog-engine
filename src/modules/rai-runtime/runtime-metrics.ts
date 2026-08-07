import type { RuntimeStepTrace } from "./runtime.types.js";

export interface RuntimeMetrics {
  readonly totalMs: number;
  readonly aiMs: number;
  readonly toolMs: number;
  readonly skillMs: number;
  readonly completedSteps: number;
  readonly skippedSteps: number;
  readonly failedSteps: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

export function buildRuntimeMetrics(trace: readonly RuntimeStepTrace[], totalMs: number, usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }): RuntimeMetrics {
  const completed = trace.filter((step) => step.status === "COMPLETED");
  return {
    totalMs,
    aiMs: sum(completed.filter((step) => step.handler === "conversation-understanding")),
    toolMs: sum(completed.filter((step) => step.kind === "TOOL")),
    skillMs: sum(completed.filter((step) => step.kind === "SKILL")),
    completedSteps: completed.length,
    skippedSteps: trace.filter((step) => step.status === "SKIPPED").length,
    failedSteps: trace.filter((step) => step.status === "FAILED").length,
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
    totalTokens: usage?.totalTokens,
  };
}

function sum(steps: readonly RuntimeStepTrace[]): number {
  return Number(steps.reduce((total, step) => total + step.durationMs, 0).toFixed(2));
}
