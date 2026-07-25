import type {
  JobContext,
  JobEventPublisher,
  JobQueue,
  JobRegistry,
  JobRunner,
  JobStore,
} from "./job-contracts.js";
import { createJobEvent } from "./job-events.js";
import type {
  JobFailure,
  JobLogEntry,
  JobProgressUpdate,
  JobRecord,
} from "./job-types.js";

export interface DefaultJobRunnerOptions {
  readonly now?: () => Date;
  readonly eventPublisher?: JobEventPublisher;
  readonly cancellationRequests?: Set<string>;
}

export class JobCancelledError extends Error {
  constructor(jobId: string) {
    super(`El Job "${jobId}" ha sido cancelado.`);
    this.name = "JobCancelledError";
  }
}

function toFailure(error: unknown): JobFailure {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack === undefined ? {} : { stack: error.stack }),
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Error desconocido.",
  };
}

export class DefaultJobRunner implements JobRunner {
  private readonly now: () => Date;
  private readonly eventPublisher?: JobEventPublisher;
  private readonly cancellationRequests: Set<string>;

  constructor(
    private readonly store: JobStore,
    private readonly queue: JobQueue,
    private readonly registry: JobRegistry,
    options: DefaultJobRunnerOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.eventPublisher = options.eventPublisher;
    this.cancellationRequests = options.cancellationRequests ?? new Set<string>();
  }

  async runNext(): Promise<JobRecord | undefined> {
    const jobId = await this.queue.dequeue();

    if (!jobId) {
      return undefined;
    }

    let job = await this.store.get(jobId);

    if (!job) {
      return undefined;
    }

    if (job.status === "cancelled") {
      return job;
    }

    if (this.cancellationRequests.has(job.id)) {
      return this.markCancelled(job);
    }

    const handler = this.registry.resolve(job.type);

    if (!handler) {
      return this.markFailed(job, {
        name: "JobHandlerNotFoundError",
        message: `No existe un handler registrado para el Job "${job.type}".`,
      });
    }

    const startedAt = this.now();
    job = await this.store.update(job.id, (current) => ({
      ...current,
      status: "running",
      attempts: current.attempts + 1,
      startedAt: current.startedAt ?? startedAt,
      updatedAt: startedAt,
      failure: undefined,
    }));

    await this.publish(
      createJobEvent("job.started", {
        jobId: job.id,
        jobType: job.type,
        attempt: job.attempts,
        maxAttempts: job.maxAttempts,
      }, this.now),
    );

    const context = this.createContext(job);

    try {
      context.throwIfCancellationRequested();
      const result = await handler(job.payload, context);
      context.throwIfCancellationRequested();

      const completedAt = this.now();
      job = await this.store.update(job.id, (current) => ({
        ...current,
        status: "completed",
        progress: 100,
        result,
        completedAt,
        updatedAt: completedAt,
      }));

      await this.publish(
        createJobEvent("job.completed", {
          jobId: job.id,
          jobType: job.type,
          attempts: job.attempts,
        }, this.now),
      );

      return job;
    } catch (error) {
      if (error instanceof JobCancelledError || this.cancellationRequests.has(job.id)) {
        return this.markCancelled(job);
      }

      const failure = toFailure(error);

      if (job.attempts < job.maxAttempts) {
        const retryingAt = this.now();
        job = await this.store.update(job.id, (current) => ({
          ...current,
          status: "retrying",
          failure,
          updatedAt: retryingAt,
        }));

        await this.publish(
          createJobEvent("job.retrying", {
            jobId: job.id,
            jobType: job.type,
            attempt: job.attempts,
            maxAttempts: job.maxAttempts,
            failure,
          }, this.now),
        );

        job = await this.store.update(job.id, (current) => ({
          ...current,
          status: "queued",
          updatedAt: this.now(),
        }));
        await this.queue.enqueue(job.id, job.priority);
        return job;
      }

      return this.markFailed(job, failure);
    }
  }

  private createContext(job: JobRecord): JobContext {
    return {
      jobId: job.id,
      attempt: job.attempts,
      maxAttempts: job.maxAttempts,
      reportProgress: async (update: JobProgressUpdate) => {
        const progress = Math.max(0, Math.min(100, Math.round(update.progress)));
        const updatedAt = this.now();

        await this.store.update(job.id, (current) => ({
          ...current,
          progress,
          updatedAt,
          logs:
            update.message === undefined
              ? current.logs
              : [
                  ...current.logs,
                  {
                    at: updatedAt,
                    level: "info",
                    message: update.message,
                    ...(update.details === undefined
                      ? {}
                      : { details: update.details }),
                  },
                ],
        }));

        await this.publish(
          createJobEvent("job.progressed", {
            jobId: job.id,
            progress,
            ...(update.message === undefined ? {} : { message: update.message }),
          }, this.now),
        );
      },
      log: async (entry: Omit<JobLogEntry, "at">) => {
        const at = this.now();
        await this.store.update(job.id, (current) => ({
          ...current,
          updatedAt: at,
          logs: [...current.logs, { ...entry, at }],
        }));
      },
      isCancellationRequested: () => this.cancellationRequests.has(job.id),
      throwIfCancellationRequested: () => {
        if (this.cancellationRequests.has(job.id)) {
          throw new JobCancelledError(job.id);
        }
      },
    };
  }

  private async markCancelled(job: JobRecord): Promise<JobRecord> {
    this.cancellationRequests.delete(job.id);
    const cancelledAt = this.now();
    const cancelled = await this.store.update(job.id, (current) => ({
      ...current,
      status: "cancelled",
      completedAt: cancelledAt,
      updatedAt: cancelledAt,
    }));

    await this.publish(
      createJobEvent("job.cancelled", {
        jobId: cancelled.id,
        jobType: cancelled.type,
      }, this.now),
    );

    return cancelled;
  }

  private async markFailed(
    job: JobRecord,
    failure: JobFailure,
  ): Promise<JobRecord> {
    const failedAt = this.now();
    const failed = await this.store.update(job.id, (current) => ({
      ...current,
      status: "failed",
      failure,
      completedAt: failedAt,
      updatedAt: failedAt,
    }));

    await this.publish(
      createJobEvent("job.failed", {
        jobId: failed.id,
        jobType: failed.type,
        attempts: failed.attempts,
        failure,
      }, this.now),
    );

    return failed;
  }

  private async publish(event: Parameters<JobEventPublisher["publish"]>[0]): Promise<void> {
    await this.eventPublisher?.publish(event);
  }
}
