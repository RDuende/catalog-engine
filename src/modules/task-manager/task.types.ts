export type TaskState =
  | "CREATED"
  | "QUEUED"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface TaskProgress {
  readonly percent?: number;
  readonly step?: string;
  readonly message: string;
}

export interface ManagedTask<TInput = unknown, TResult = unknown> {
  readonly id: string;
  readonly type: string;
  readonly capabilityId?: string;
  readonly correlationId?: string;
  readonly state: TaskState;
  readonly input: TInput;
  readonly result?: TResult;
  readonly error?: string;
  readonly progress?: TaskProgress;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly cancellable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
}

export type TaskEventType =
  | "TASK_CREATED"
  | "TASK_QUEUED"
  | "TASK_STARTED"
  | "TASK_PROGRESS"
  | "TASK_COMPLETED"
  | "TASK_FAILED"
  | "TASK_CANCELLED"
  | "TASK_RETRYING";

export interface TaskEvent<TResult = unknown> {
  readonly sequence: number;
  readonly taskId: string;
  readonly type: TaskEventType;
  readonly occurredAt: string;
  readonly state: TaskState;
  readonly progress?: TaskProgress;
  readonly result?: TResult;
  readonly error?: string;
}

export interface TaskExecutionContext {
  readonly taskId: string;
  readonly attempt: number;
  readonly signal: AbortSignal;
  progress(update: TaskProgress): void;
}

export type TaskExecutor<TInput, TResult> = (
  input: TInput,
  context: TaskExecutionContext,
) => Promise<TResult>;

export interface CreateTaskInput<TInput, TResult> {
  readonly type: string;
  readonly input: TInput;
  readonly executor: TaskExecutor<TInput, TResult>;
  readonly capabilityId?: string;
  readonly correlationId?: string;
  readonly maxAttempts?: number;
  readonly cancellable?: boolean;
}

export type TaskEventListener = (event: TaskEvent) => void;

export interface TaskEventSubscription {
  unsubscribe(): void;
}
