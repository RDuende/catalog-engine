import { randomUUID } from "node:crypto";
import type { JobProgress, JobRecord, PipelineContext, PipelineDefinition } from "./core-sync-types.js";
import { PipelineEngine } from "./pipeline-engine.js";
import { CoreSyncEventBus, coreSyncEventBus } from "./event-bus.js";
import { JobStore, jobStore } from "./job-store.js";

interface InternalJob<TResult = unknown> {
  record: JobRecord<TResult>;
  controller: AbortController;
  run: () => Promise<void>;
}

export interface CreatePipelineJobOptions<TInput> {
  type: string;
  provider?: string;
  input: TInput;
  metadata?: Record<string, unknown>;
}

export class JobManager {
  private readonly jobs = new Map<string, InternalJob>();
  private readonly queue: string[] = [];
  private activeWorkers = 0;

  constructor(
    private readonly pipelineEngine = new PipelineEngine(),
    private readonly events: CoreSyncEventBus = coreSyncEventBus,
    private readonly concurrency = Math.max(1, Number(process.env.SYNC_JOB_CONCURRENCY ?? 1)),
    private readonly maxRetainedJobs = Math.max(10, Number(process.env.SYNC_JOB_RETENTION ?? 500)),
    private readonly store: JobStore = jobStore,
  ) {}

  create<TInput, TResult>(
    pipeline: PipelineDefinition<TInput, TResult>,
    options: CreatePipelineJobOptions<TInput>,
  ): JobRecord<TResult> {
    const id = randomUUID();
    const controller = new AbortController();
    const record: JobRecord<TResult> = {
      id,
      type: options.type,
      provider: options.provider,
      status: "QUEUED",
      progress: { step: "queued", completed: 0, total: pipeline.stages.length, percent: 0 },
      createdAt: new Date().toISOString(),
      metadata: options.metadata ?? {},
    };

    const internal: InternalJob<TResult> = {
      record,
      controller,
      run: async () => this.executeJob(pipeline, options.input, internal),
    };
    this.jobs.set(id, internal as InternalJob);
    void this.store.save(record).catch(() => undefined);
    this.queue.push(id);
    void this.events.emit("JobQueued", { type: record.type, provider: record.provider }, id);
    queueMicrotask(() => void this.drain());
    this.prune();
    return structuredClone(record);
  }

  get<TResult = unknown>(id: string): JobRecord<TResult> | undefined {
    const job = this.jobs.get(id);
    return job ? structuredClone(job.record as JobRecord<TResult>) : undefined;
  }

  list(filters?: { status?: string; provider?: string; limit?: number }): JobRecord[] {
    const limit = Math.max(1, Math.min(filters?.limit ?? 50, 200));
    return [...this.jobs.values()]
      .map(item => item.record)
      .filter(job => !filters?.status || job.status === filters.status)
      .filter(job => !filters?.provider || job.provider === filters.provider)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(job => structuredClone(job));
  }

  async cancel(id: string): Promise<JobRecord | undefined> {
    const job = this.jobs.get(id);
    if (!job || ["COMPLETED", "FAILED", "CANCELLED"].includes(job.record.status)) return job ? structuredClone(job.record) : undefined;
    job.controller.abort();
    job.record.status = "CANCELLED";
    job.record.finishedAt = new Date().toISOString();
    job.record.progress.message = "Trabajo cancelado";
    const queueIndex = this.queue.indexOf(id);
    if (queueIndex >= 0) this.queue.splice(queueIndex, 1);
    await this.events.emit("JobCancelled", {}, id);
    await this.store.save(job.record);
    return structuredClone(job.record);
  }

  private async drain(): Promise<void> {
    while (this.activeWorkers < this.concurrency) {
      const id = this.queue.shift();
      if (!id) return;
      const job = this.jobs.get(id);
      if (!job || job.record.status === "CANCELLED") continue;
      this.activeWorkers += 1;
      void job.run().finally(() => {
        this.activeWorkers -= 1;
        queueMicrotask(() => void this.drain());
      });
    }
  }

  private async executeJob<TInput, TResult>(
    pipeline: PipelineDefinition<TInput, TResult>,
    input: TInput,
    job: InternalJob<TResult>,
  ): Promise<void> {
    const id = job.record.id;
    job.record.status = "RUNNING";
    job.record.startedAt = new Date().toISOString();
    await this.events.emit("JobStarted", { type: job.record.type, provider: job.record.provider }, id);
    await this.store.save(job.record);

    const context: PipelineContext<TInput, TResult> = {
      jobId: id,
      input,
      data: new Map<string, unknown>(),
      signal: job.controller.signal,
      reportProgress: progress => this.updateProgress(job.record, progress),
    };

    try {
      const result = await this.pipelineEngine.execute(pipeline, context);
      if (!job.controller.signal.aborted) {
        const completedRecord: JobRecord<TResult> = {
          ...structuredClone(job.record),
          result,
          status: "COMPLETED",
          finishedAt: new Date().toISOString(),
        };
        await this.events.emit("JobCompleted", { result }, id);
        await this.store.save(completedRecord);
        job.record = completedRecord;
      }
    } catch (error) {
      if (!job.controller.signal.aborted) {
        const failure = {
          name: error instanceof Error ? error.name : "Error",
          message: error instanceof Error ? error.message : String(error),
          stack: process.env.NODE_ENV === "production" ? undefined : error instanceof Error ? error.stack : undefined,
        };
        const failedRecord: JobRecord<TResult> = {
          ...structuredClone(job.record),
          status: "FAILED",
          finishedAt: new Date().toISOString(),
          error: failure,
        };
        await this.events.emit("JobFailed", { error: failure }, id);
        await this.store.save(failedRecord);
        job.record = failedRecord;
      }
    }
  }

  private updateProgress(record: JobRecord, progress: Omit<JobProgress, "percent"> & { percent?: number }): void {
    const total = Math.max(0, progress.total);
    const completed = Math.max(0, Math.min(progress.completed, total || progress.completed));
    record.progress = {
      ...progress,
      completed,
      total,
      percent: progress.percent ?? (total === 0 ? 0 : Math.round((completed / total) * 100)),
    };
    void this.store.save(record).catch(() => undefined);
  }

  private prune(): void {
    const completed = [...this.jobs.entries()]
      .filter(([, job]) => ["COMPLETED", "FAILED", "CANCELLED"].includes(job.record.status))
      .sort((a, b) => a[1].record.createdAt.localeCompare(b[1].record.createdAt));
    while (this.jobs.size > this.maxRetainedJobs && completed.length > 0) {
      const oldest = completed.shift();
      if (oldest) this.jobs.delete(oldest[0]);
    }
  }
}

export const jobManager = new JobManager();
