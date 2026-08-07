import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname } from "node:path";

import type {
  JourneyMemory,
  MemoryStore,
} from "./memory-brain.types.js";

export class InMemoryMemoryStore
  implements MemoryStore {
  readonly #items =
    new Map<string, JourneyMemory>();

  async get(
    journeyId: string,
    ownerId: string,
  ): Promise<JourneyMemory | undefined> {
    return this.#items.get(
      `${ownerId}:${journeyId}`,
    );
  }

  async save(
    memory: JourneyMemory,
  ): Promise<void> {
    this.#items.set(
      `${memory.ownerId}:${memory.journeyId}`,
      memory,
    );
  }
}

export class JsonFileMemoryStore
  implements MemoryStore {
  constructor(
    private readonly filePath: string,
  ) {}

  async get(
    journeyId: string,
    ownerId: string,
  ): Promise<JourneyMemory | undefined> {
    const all = await this.#readAll();
    return all.find(
      (item) =>
        item.journeyId === journeyId &&
        item.ownerId === ownerId,
    );
  }

  async save(
    memory: JourneyMemory,
  ): Promise<void> {
    const all = await this.#readAll();
    const filtered = all.filter(
      (item) =>
        !(
          item.journeyId ===
            memory.journeyId &&
          item.ownerId ===
            memory.ownerId
        ),
    );

    await mkdir(
      dirname(this.filePath),
      { recursive: true },
    );

    await writeFile(
      this.filePath,
      JSON.stringify(
        [...filtered, memory],
        null,
        2,
      ),
      "utf8",
    );
  }

  async #readAll():
    Promise<readonly JourneyMemory[]> {
    try {
      const raw = JSON.parse(
        await readFile(
          this.filePath,
          "utf8",
        ),
      ) as unknown;

      return Array.isArray(raw)
        ? raw as JourneyMemory[]
        : [];
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }

      throw error;
    }
  }
}
