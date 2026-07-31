export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface JobProgress {
  step: string;
  completed: number;
  total: number;
  percent: number;
  message?: string;
}

export interface JobError {
  name: string;
  message: string;
  stack?: string;
}

export interface JobRecord<TResult = unknown> {
  id: string;
  type: string;
  provider?: string;
  status: JobStatus;
  progress: JobProgress;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: TResult;
  error?: JobError;
  metadata: Record<string, unknown>;
}

export interface StageMetric {
  stage: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: "COMPLETED" | "FAILED";
  error?: string;
}

export interface PipelineContext<TInput = unknown, TResult = unknown> {
  jobId: string;
  input: TInput;
  data: Map<string, unknown>;
  result?: TResult;
  signal: AbortSignal;
  reportProgress(progress: Omit<JobProgress, "percent"> & { percent?: number }): void;
}

export interface PipelineStage<TInput = unknown, TResult = unknown> {
  readonly name: string;
  execute(context: PipelineContext<TInput, TResult>): Promise<void>;
}

export interface PipelineDefinition<TInput = unknown, TResult = unknown> {
  readonly name: string;
  readonly stages: readonly PipelineStage<TInput, TResult>[];
  onError?(context: PipelineContext<TInput, TResult>, error: unknown): Promise<void>;
  onCancel?(context: PipelineContext<TInput, TResult>): Promise<void>;
}

export interface CoreSyncEvent<TPayload = unknown> {
  id: string;
  type: string;
  occurredAt: string;
  jobId?: string;
  payload: TPayload;
}
