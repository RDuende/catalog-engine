import type { JobQueue } from "./job-contracts.js";

interface QueueEntry {
  readonly jobId: string;
  readonly priority: number;
  readonly sequence: number;
}

export class InMemoryJobQueue implements JobQueue {
  private readonly entries: QueueEntry[] = [];
  private sequence = 0;

  async enqueue(jobId: string, priority: number): Promise<void> {
    if (this.entries.some((entry) => entry.jobId === jobId)) {
      return;
    }

    this.sequence += 1;
    this.entries.push({ jobId, priority, sequence: this.sequence });
    this.entries.sort(
      (left, right) =>
        right.priority - left.priority || left.sequence - right.sequence,
    );
  }

  async dequeue(): Promise<string | undefined> {
    return this.entries.shift()?.jobId;
  }

  async remove(jobId: string): Promise<boolean> {
    const index = this.entries.findIndex((entry) => entry.jobId === jobId);

    if (index < 0) {
      return false;
    }

    this.entries.splice(index, 1);
    return true;
  }

  size(): number {
    return this.entries.length;
  }
}
