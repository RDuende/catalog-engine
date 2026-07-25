import type { DomainEvent } from "../events/domain-events.js";
import type { JobFailure } from "./job-types.js";

export type JobQueued = DomainEvent<"job.queued", {
  jobId: string;
  jobType: string;
  priority: number;
}>;

export type JobStarted = DomainEvent<"job.started", {
  jobId: string;
  jobType: string;
  attempt: number;
  maxAttempts: number;
}>;

export type JobProgressed = DomainEvent<"job.progressed", {
  jobId: string;
  progress: number;
  message?: string;
}>;

export type JobCompleted = DomainEvent<"job.completed", {
  jobId: string;
  jobType: string;
  attempts: number;
}>;

export type JobFailed = DomainEvent<"job.failed", {
  jobId: string;
  jobType: string;
  attempts: number;
  failure: JobFailure;
}>;

export type JobRetrying = DomainEvent<"job.retrying", {
  jobId: string;
  jobType: string;
  attempt: number;
  maxAttempts: number;
  failure: JobFailure;
}>;

export type JobCancelled = DomainEvent<"job.cancelled", {
  jobId: string;
  jobType: string;
}>;

export type JobDomainEvent =
  | JobQueued
  | JobStarted
  | JobProgressed
  | JobCompleted
  | JobFailed
  | JobRetrying
  | JobCancelled;

let eventSequence = 0;

export function createJobEvent<TEvent extends JobDomainEvent>(
  name: TEvent["name"],
  payload: TEvent["payload"],
  now: () => Date = () => new Date(),
): TEvent {
  eventSequence += 1;

  return {
    id: `job-event-${now().getTime()}-${eventSequence}`,
    name,
    occurredAt: now(),
    payload,
  } as TEvent;
}
