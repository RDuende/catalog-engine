import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  join,
} from "node:path";

import type {
  MemoryRecord,
} from "./memory-brain.types.js";

export interface MemoryStore {
  list(): Promise<readonly MemoryRecord[]>;
  save(
    records: readonly MemoryRecord[],
  ): Promise<void>;
}

export class JsonFileMemoryStore
implements MemoryStore {
  constructor(
    readonly filePath =
      join(
        process.cwd(),
        "storage",
        "memory-brain",
        "memories.json",
      ),
  ) {}

  async list():
    Promise<readonly MemoryRecord[]> {
    try {
      const raw =
        await readFile(
          this.filePath,
          "utf8",
        );

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed as
            readonly MemoryRecord[]
        : [];
    } catch (error) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error
          ? String(
              (
                error as
                  { code?: unknown }
              ).code,
            )
          : "";

      if (code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  async save(
    records:
      readonly MemoryRecord[],
  ): Promise<void> {
    await mkdir(
      dirname(this.filePath),
      { recursive: true },
    );

    await writeFile(
      this.filePath,
      JSON.stringify(
        records,
        null,
        2,
      ) + "\n",
      "utf8",
    );
  }
}
