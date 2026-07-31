import { mkdir, rename, writeFile, readFile, readdir, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface SnapshotManifest {
  jobId: string;
  provider: string;
  createdAt: string;
  completedAt?: string;
  status: "WRITING" | "COMPLETED" | "FAILED";
  files: Record<string, { path: string; bytes: number }>;
  stats?: Record<string, unknown>;
  error?: string;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

async function atomicJson(path: string, value: unknown): Promise<number> {
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, payload, "utf8");
  await rename(temporary, path);
  return Buffer.byteLength(payload);
}

export class SnapshotService {
  constructor(private readonly root = resolve(process.env.PROVIDER_STORAGE_PATH ?? "storage/providers")) {}

  directory(provider: string, jobId: string): string {
    return join(this.root, safeSegment(provider), "snapshots", safeSegment(jobId));
  }

  async create(provider: string, jobId: string): Promise<SnapshotManifest> {
    const directory = this.directory(provider, jobId);
    await mkdir(directory, { recursive: true });
    const manifest: SnapshotManifest = {
      jobId,
      provider,
      createdAt: new Date().toISOString(),
      status: "WRITING",
      files: {},
    };
    await atomicJson(join(directory, "manifest.json"), manifest);
    return manifest;
  }

  async write(provider: string, jobId: string, name: string, value: unknown, manifest: SnapshotManifest): Promise<void> {
    const filename = `${safeSegment(name)}.json`;
    const directory = this.directory(provider, jobId);
    const bytes = await atomicJson(join(directory, filename), value);
    manifest.files[name] = { path: filename, bytes };
    await atomicJson(join(directory, "manifest.json"), manifest);
  }

  async complete(provider: string, jobId: string, manifest: SnapshotManifest, stats?: Record<string, unknown>): Promise<void> {
    manifest.status = "COMPLETED";
    manifest.completedAt = new Date().toISOString();
    manifest.stats = stats;
    await atomicJson(join(this.directory(provider, jobId), "manifest.json"), manifest);
  }

  async fail(provider: string, jobId: string, manifest: SnapshotManifest, error: unknown): Promise<void> {
    manifest.status = "FAILED";
    manifest.completedAt = new Date().toISOString();
    manifest.error = error instanceof Error ? error.message : String(error);
    await atomicJson(join(this.directory(provider, jobId), "manifest.json"), manifest);
  }

  async writeReport(provider: string, jobId: string, report: unknown): Promise<string> {
    const reportDirectory = join(this.root, safeSegment(provider), "reports");
    await mkdir(reportDirectory, { recursive: true });
    const path = join(reportDirectory, `${safeSegment(jobId)}.json`);
    await atomicJson(path, report);
    await atomicJson(join(reportDirectory, "last-report.json"), report);
    return path;
  }

  async lastReport(provider: string): Promise<unknown | undefined> {
    try {
      const content = await readFile(join(this.root, safeSegment(provider), "reports", "last-report.json"), "utf8");
      return JSON.parse(content) as unknown;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }

  async listReports(provider: string, limit = 20): Promise<string[]> {
    try {
      const entries = (await readdir(join(this.root, safeSegment(provider), "reports")))
        .filter(name => name.endsWith(".json") && name !== "last-report.json");
      return entries.sort().reverse().slice(0, Math.max(1, Math.min(limit, 100)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async cleanup(provider: string, options?: { keep?: number; maxAgeDays?: number }): Promise<{ removed: string[]; kept: number }> {
    const keep = Math.max(1, options?.keep ?? Number(process.env.PROVIDER_SNAPSHOT_RETENTION ?? 10));
    const maxAgeDays = Math.max(0, options?.maxAgeDays ?? Number(process.env.PROVIDER_SNAPSHOT_MAX_AGE_DAYS ?? 30));
    const base = join(this.root, safeSegment(provider), "snapshots");
    try {
      const entries = await readdir(base);
      const detailed = await Promise.all(entries.map(async name => ({ name, modifiedMs: (await stat(join(base, name))).mtimeMs })));
      detailed.sort((a, b) => b.modifiedMs - a.modifiedMs);
      const threshold = Date.now() - maxAgeDays * 86_400_000;
      const removable = detailed.filter((entry, index) => index >= keep || (maxAgeDays > 0 && entry.modifiedMs < threshold));
      for (const entry of removable) await rm(join(base, entry.name), { recursive: true, force: true });
      return { removed: removable.map(entry => entry.name), kept: detailed.length - removable.length };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { removed: [], kept: 0 };
      throw error;
    }
  }

  async list(provider: string, limit = 20): Promise<string[]> {
    try {
      const entries = await readdir(join(this.root, safeSegment(provider), "snapshots"));
      return entries.sort().reverse().slice(0, Math.max(1, Math.min(limit, 100)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}

export const snapshotService = new SnapshotService();
