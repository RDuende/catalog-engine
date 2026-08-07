import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import type {
  ChannelPublication,
  ChannelPublicationRepository,
} from "./channel-adapter.types.js";

export class InMemoryChannelPublicationRepository
  implements ChannelPublicationRepository
{
  readonly #records = new Map<string, ChannelPublication>();

  save(publication: ChannelPublication): ChannelPublication {
    this.#records.set(publication.id, publication);
    return publication;
  }

  getById(id: string): ChannelPublication | undefined {
    return this.#records.get(id);
  }

  getByIdempotencyKey(
    idempotencyKey: string,
  ): ChannelPublication | undefined {
    return [...this.#records.values()].find(
      (item) => item.idempotencyKey === idempotencyKey,
    );
  }

  listAll(): readonly ChannelPublication[] {
    return Object.freeze([...this.#records.values()]);
  }

  listByOrder(orderId: string): readonly ChannelPublication[] {
    return Object.freeze(
      [...this.#records.values()]
        .filter((item) => item.orderId === orderId)
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
    );
  }
}

export class FileChannelPublicationRepository
  implements ChannelPublicationRepository
{
  readonly #filePath: string;

  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  save(publication: ChannelPublication): ChannelPublication {
    const records = this.#load();
    const index = records.findIndex(
      (item) => item.id === publication.id,
    );

    if (index >= 0) {
      records[index] = publication;
    } else {
      records.push(publication);
    }

    this.#persist(records);
    return publication;
  }

  getById(id: string): ChannelPublication | undefined {
    return this.#load().find((item) => item.id === id);
  }

  getByIdempotencyKey(
    idempotencyKey: string,
  ): ChannelPublication | undefined {
    return this.#load().find(
      (item) => item.idempotencyKey === idempotencyKey,
    );
  }

  listAll(): readonly ChannelPublication[] {
    return Object.freeze(this.#load());
  }

  listByOrder(orderId: string): readonly ChannelPublication[] {
    return Object.freeze(
      this.#load()
        .filter((item) => item.orderId === orderId)
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
    );
  }

  #load(): ChannelPublication[] {
    try {
      const parsed = JSON.parse(
        readFileSync(this.#filePath, "utf8"),
      ) as unknown;

      return Array.isArray(parsed)
        ? (parsed as ChannelPublication[])
        : [];
    } catch {
      return [];
    }
  }

  #persist(records: readonly ChannelPublication[]): void {
    mkdirSync(dirname(this.#filePath), {
      recursive: true,
    });

    const temporary = `${this.#filePath}.tmp`;

    writeFileSync(
      temporary,
      JSON.stringify(records, null, 2),
      "utf8",
    );
    renameSync(temporary, this.#filePath);
  }
}
