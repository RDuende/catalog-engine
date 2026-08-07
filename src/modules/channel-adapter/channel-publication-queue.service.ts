import { randomUUID } from "node:crypto";

import type {
  ChannelPublicationQueueItem,
  ChannelPublicationQueueRepository,
  PublishPurchaseOrderInput,
} from "./channel-adapter.types.js";
import type {
  ChannelAdapterService,
} from "./channel-adapter.service.js";

function nextAttempt(
  attempts: number,
  now = Date.now(),
): string {
  const seconds = Math.min(
    3600,
    15 * 2 ** Math.max(0, attempts - 1),
  );
  return new Date(now + seconds * 1000).toISOString();
}

export class ChannelPublicationQueueService {
  constructor(
    private readonly channels: ChannelAdapterService,
    private readonly queue: ChannelPublicationQueueRepository,
  ) {}

  enqueue(input: {
    readonly orderId: string;
    readonly publicationId: string;
    readonly channel: PublishPurchaseOrderInput["channel"];
    readonly maxAttempts?: number;
  }): ChannelPublicationQueueItem {
    const now = new Date().toISOString();

    const item = Object.freeze({
      id: randomUUID(),
      publicationId: input.publicationId,
      orderId: input.orderId,
      channel: input.channel,
      attempts: 0,
      maxAttempts: Math.max(
        1,
        Math.min(12, input.maxAttempts ?? 6),
      ),
      status: "QUEUED" as const,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return this.queue.save(item);
  }

  async runDue(
    now = new Date().toISOString(),
  ): Promise<readonly ChannelPublicationQueueItem[]> {
    const processed: ChannelPublicationQueueItem[] = [];

    for (const item of this.queue.listDue(now)) {
      const running = this.queue.save(
        Object.freeze({
          ...item,
          status: "RUNNING",
          attempts: item.attempts + 1,
          updatedAt: now,
        }),
      );

      try {
        await this.channels.retryPublication(
          running.publicationId,
        );

        processed.push(
          this.queue.save(
            Object.freeze({
              ...running,
              status: "COMPLETED",
              updatedAt: new Date().toISOString(),
            }),
          ),
        );
      } catch (error) {
        const failedAt = new Date().toISOString();
        const failed = Object.freeze({
          ...running,
          status:
            running.attempts >= running.maxAttempts
              ? ("FAILED" as const)
              : ("QUEUED" as const),
          lastError:
            error instanceof Error
              ? error.message
              : String(error),
          nextAttemptAt: nextAttempt(
            running.attempts,
          ),
          updatedAt: failedAt,
        });

        processed.push(this.queue.save(failed));
      }
    }

    return Object.freeze(processed);
  }
}
