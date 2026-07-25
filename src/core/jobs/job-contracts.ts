import type { DomainEvent } from "../events/domain-events.js";
import type {
  JobDefinition,
  JobListFilter,
  JobLogEntry,
  JobProgressUpdate,
  JobRecord,
} from "./job-types.js";

export interface JobContext {
  readonly jobId: string;
  readonly attempt: number;
  readonly maxAttempts: number;
  reportProgress(update: JobProgressUpdate): Promise<void>;
  log(entry: Omit<JobLogEntry, "at">): Promise<void>;
  isCancellationRequested(): boolean;
  throwIfCancellationRequested(): void;
}

export type JobHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
  context: JobContext,
) => TResult | Promise<TResult>;

export interface JobRegistry {
  register<TPayload, TResult>(
    type: string,
    handler: JobHandler<TPayload, TResult>,
  ): () => void;
  resolve(type: string): JobHandler | undefined;
  has(type: string): boolean;
}

export interface JobStore {
  create<TPayload>(definition: JobDefinition<TPayload>): Promise<JobRecord<TPayload>>;
  get(id: string): Promise<JobRecord | undefined>;
  update(id: string, updater: (job: JobRecord) => JobRecord): Promise<JobRecord>;
  list(filter?: JobListFilter): Promise<readonly JobRecord[]>;
}

export interface JobQueue {
  enqueue(jobId: string, priority: number): Promise<void>;
  dequeue(): Promise<string | undefined>;
  remove(jobId: string): Promise<boolean>;
  size(): number;
}

export interface JobEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export interface JobRunner {
  runNext(): Promise<JobRecord | undefined>;
}
