import { randomUUID } from "node:crypto";
import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import type { JobRecord } from "./core-sync-types.js";

const WINDOWS_RETRYABLE_CODES = new Set(["EPERM", "EACCES", "EBUSY", "EEXIST"]);

const sleep = (milliseconds: number): Promise<void> =>
  new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));

function isRetryableFileSystemError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return typeof code === "string" && WINDOWS_RETRYABLE_CODES.has(code);
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const temp = `${path}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");

  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        await rename(temp, path);
        return;
      } catch (error) {
        if (!isRetryableFileSystemError(error)) throw error;

        // Windows puede bloquear brevemente el destino (Defender, indexador o
        // una lectura concurrente). Esperamos de forma incremental antes de
        // utilizar la sustitución compatible mediante copyFile.
        if (attempt < 5) {
          await sleep(10 * (attempt + 1));
          continue;
        }
      }
    }

    // Fallback compatible con Windows. copyFile reemplaza el contenido del
    // destino sin depender de que rename pueda sustituir un archivo existente.
    await copyFile(temp, path);
  } finally {
    await rm(temp, { force: true }).catch(() => undefined);
  }
}

export class JobStore {
  private readonly pendingWrites = new Map<string, Promise<void>>();

  constructor(private readonly root = resolve(process.env.SYNC_JOB_STORAGE_PATH ?? "storage/jobs")) {}

  async save(record: JobRecord): Promise<void> {
    const snapshot = structuredClone(record);
    const previous = this.pendingWrites.get(record.id) ?? Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(async () => {
        await mkdir(this.root, { recursive: true });
        await atomicJson(join(this.root, `${snapshot.id}.json`), snapshot);
        await appendFile(
          join(this.root, "events.jsonl"),
          `${JSON.stringify({
            at: new Date().toISOString(),
            jobId: snapshot.id,
            status: snapshot.status,
            progress: snapshot.progress,
          })}\n`,
          "utf8",
        );
      });

    this.pendingWrites.set(record.id, current);
    try {
      await current;
    } finally {
      if (this.pendingWrites.get(record.id) === current) this.pendingWrites.delete(record.id);
    }
  }

  async flush(id?: string): Promise<void> {
    while (true) {
      const pending = id
        ? [this.pendingWrites.get(id)].filter((value): value is Promise<void> => Boolean(value))
        : [...this.pendingWrites.values()];
      if (pending.length === 0) return;
      await Promise.allSettled(pending);
    }
  }

  async get(id: string): Promise<JobRecord | undefined> {
    try {
      return JSON.parse(await readFile(join(this.root, `${id}.json`), "utf8")) as JobRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }

  async list(limit = 100): Promise<JobRecord[]> {
    try {
      const names = (await readdir(this.root)).filter(name => name.endsWith(".json") && name !== "last.json");
      const records = await Promise.all(
        names.map(async name => JSON.parse(await readFile(join(this.root, name), "utf8")) as JobRecord),
      );
      return records
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, Math.max(1, Math.min(limit, 500)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}

export const jobStore = new JobStore();
