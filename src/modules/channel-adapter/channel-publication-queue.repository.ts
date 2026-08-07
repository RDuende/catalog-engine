import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import type {
  ChannelPublicationQueueItem,
  ChannelPublicationQueueRepository,
} from "./channel-adapter.types.js";

export class FileChannelPublicationQueueRepository
  implements ChannelPublicationQueueRepository
{
  constructor(private readonly filePath: string) {}

  save(
    item: ChannelPublicationQueueItem,
  ): ChannelPublicationQueueItem {
    const records = this.load();
    const index = records.findIndex(
      (current) => current.id === item.id,
    );

    if (index >= 0) records[index] = item;
    else records.push(item);

    this.persist(records);
    return item;
  }

  getById(
    id: string,
  ): ChannelPublicationQueueItem | undefined {
    return this.load().find((item) => item.id === id);
  }

  listDue(
    now: string,
  ): readonly ChannelPublicationQueueItem[] {
    return Object.freeze(
      this.load()
        .filter(
          (item) =>
            (item.status === "QUEUED" ||
              item.status === "FAILED") &&
            item.nextAttemptAt <= now &&
            item.attempts < item.maxAttempts,
        )
        .sort((left, right) =>
          left.nextAttemptAt.localeCompare(
            right.nextAttemptAt,
          ),
        ),
    );
  }

  private load(): ChannelPublicationQueueItem[] {
    try {
      const parsed = JSON.parse(
        readFileSync(this.filePath, "utf8"),
      ) as unknown;
      return Array.isArray(parsed)
        ? (parsed as ChannelPublicationQueueItem[])
        : [];
    } catch {
      return [];
    }
  }

  private persist(
    records: readonly ChannelPublicationQueueItem[],
  ): void {
    mkdirSync(dirname(this.filePath), {
      recursive: true,
    });

    const temporary = `${this.filePath}.tmp`;
    writeFileSync(
      temporary,
      JSON.stringify(records, null, 2),
      "utf8",
    );
    renameSync(temporary, this.filePath);
  }
}
