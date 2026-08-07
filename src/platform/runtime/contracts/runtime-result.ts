import type { Decision } from "./decision.js";
import type { RaiContext } from "./rai-context.js";

export interface RuntimeTraceEntry {
  readonly stepId: string;
  readonly status: "COMPLETED" | "SKIPPED" | "FAILED";
  readonly durationMs: number;
  readonly error?: string;
}

export interface RuntimeExecutionResult<TData = Readonly<Record<string, unknown>>> {
  readonly runtimeId: string;
  readonly status: "COMPLETED" | "WAITING_FOR_USER" | "FAILED";
  readonly context: RaiContext;
  readonly decision: Decision;
  readonly data: TData;
  readonly trace: readonly RuntimeTraceEntry[];
  readonly durationMs: number;
}
