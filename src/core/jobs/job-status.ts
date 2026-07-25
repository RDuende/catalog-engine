export const JOB_STATUSES = [
  "pending",
  "queued",
  "running",
  "completed",
  "failed",
  "retrying",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export function isTerminalJobStatus(status: JobStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}
