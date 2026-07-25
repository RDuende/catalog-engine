import type { JobStatus } from "./job-status.js";

export type JobPriority = number;

export interface JobOptions {
  readonly priority?: JobPriority;
  readonly maxAttempts?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface JobDefinition<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly options?: JobOptions;
}

export interface JobFailure {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
}

export interface JobLogEntry {
  readonly at: Date;
  readonly level: "debug" | "info" | "warn" | "error";
  readonly message: string;
  readonly details?: unknown;
}

export interface JobRecord<TPayload = unknown, TResult = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly status: JobStatus;
  readonly priority: JobPriority;
  readonly progress: number;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly result?: TResult;
  readonly failure?: JobFailure;
  readonly logs: readonly JobLogEntry[];
}

export interface JobListFilter {
  readonly status?: JobStatus;
  readonly type?: string;
}

export interface JobProgressUpdate {
  readonly progress: number;
  readonly message?: string;
  readonly details?: unknown;
}
