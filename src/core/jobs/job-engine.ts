import type {
  JobEventPublisher,
  JobHandler,
  JobQueue,
  JobRegistry,
  JobStore,
} from "./job-contracts.js";
import { createJobEvent } from "./job-events.js";
import { DefaultJobRunner } from "./job-runner.js";
import type { JobDefinition, JobListFilter, JobRecord } from "./job-types.js";

export interface JobEngineOptions {
  readonly eventPublisher?: JobEventPublisher;
  readonly now?: () => Date;
}

export class JobEngine {
  private readonly cancellationRequests = new Set<string>();
  private readonly runner: DefaultJobRunner;
  private readonly eventPublisher?: JobEventPublisher;
  private readonly now: () => Date;

  constructor(
    private readonly store: JobStore,
    private readonly queue: JobQueue,
    private readonly registry: JobRegistry,
    options: JobEngineOptions = {},
  ) {
    this.eventPublisher = options.eventPublisher;
    this.now = options.now ?? (() => new Date());
    this.runner = new DefaultJobRunner(store, queue, registry, {
      eventPublisher: options.eventPublisher,
      now: options.now,
      cancellationRequests: this.cancellationRequests,
    });
  }

  register<TPayload, TResult>(
    type: string,
    handler: JobHandler<TPayload, TResult>,
  ): () => void {
    return this.registry.register(type, handler);
  }

  async enqueue<TPayload>(
    definition: JobDefinition<TPayload>,
  ): Promise<JobRecord<TPayload>> {
    let job = await this.store.create(definition);
    const queuedAt = this.now();

    job = (await this.store.update(job.id, (current) => ({
      ...current,
      status: "queued",
      updatedAt: queuedAt,
    }))) as JobRecord<TPayload>;

    await this.queue.enqueue(job.id, job.priority);
    await this.eventPublisher?.publish(
      createJobEvent("job.queued", {
        jobId: job.id,
        jobType: job.type,
        priority: job.priority,
      }, this.now),
    );

    return job;
  }

  async runNext(): Promise<JobRecord | undefined> {
    return this.runner.runNext();
  }

  async drain(maxJobs = Number.POSITIVE_INFINITY): Promise<readonly JobRecord[]> {
    if (maxJobs <= 0) {
      return [];
    }

    const processed: JobRecord[] = [];

    while (processed.length < maxJobs) {
      const job = await this.runNext();

      if (!job) {
        break;
      }

      processed.push(job);
    }

    return processed;
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = await this.store.get(jobId);

    if (!job || job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      return false;
    }

    this.cancellationRequests.add(jobId);

    if (job.status === "queued" || job.status === "pending" || job.status === "retrying") {
      await this.queue.remove(jobId);
      const cancelledAt = this.now();
      const cancelled = await this.store.update(jobId, (current) => ({
        ...current,
        status: "cancelled",
        completedAt: cancelledAt,
        updatedAt: cancelledAt,
      }));
      this.cancellationRequests.delete(jobId);

      await this.eventPublisher?.publish(
        createJobEvent("job.cancelled", {
          jobId: cancelled.id,
          jobType: cancelled.type,
        }, this.now),
      );
    }

    return true;
  }

  async get(jobId: string): Promise<JobRecord | undefined> {
    return this.store.get(jobId);
  }

  async list(filter?: JobListFilter): Promise<readonly JobRecord[]> {
    return this.store.list(filter);
  }

  queueSize(): number {
    return this.queue.size();
  }
}
