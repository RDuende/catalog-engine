import type { RcePlannedTask, RceTaskType } from "./conversation-planner.contracts.js";

export type RceRuntimeTaskStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "SUPERSEDED";

export interface RceRuntimeTask {
  readonly id: string;
  readonly conversationId: string;
  readonly planTaskId: string;
  readonly type: RceTaskType;
  readonly status: RceRuntimeTaskStatus;
  readonly priority: number;
  readonly reason: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly fingerprint: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly attempts: number;
  readonly result?: unknown;
  readonly error?: string;
}

export interface RceTaskRuntimeSnapshot {
  readonly conversationId: string;
  readonly tasks: readonly RceRuntimeTask[];
  readonly progress: {
    readonly total: number;
    readonly queued: number;
    readonly running: number;
    readonly completed: number;
    readonly failed: number;
    readonly percent: number;
  };
  readonly updatedAt: string;
}

export interface RceTaskExecutionContext {
  readonly task: RceRuntimeTask;
  readonly signal?: AbortSignal;
}

export type RceTaskHandler = (
  context: RceTaskExecutionContext,
) => Promise<unknown>;

export interface RceTaskRuntimePlanInput {
  readonly conversationId: string;
  readonly tasks: readonly RcePlannedTask[];
  readonly now?: string;
}
