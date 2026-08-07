import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import {
  ArtifactStorageConflictError,
  ArtifactStorageNotFoundError,
  ArtifactStoragePathError,
} from "./artifact-storage.errors.js";
import type {
  ArtifactStorage,
  ArtifactStorageWriteInput,
  StoredArtifactObject,
} from "./artifact-storage.types.js";

const MANIFEST_SUFFIX = ".artifact.json";

export interface LocalArtifactStorageOptions {
  readonly rootDirectory: string;
  readonly publicBaseUrl?: string | undefined;
  readonly now?: (() => Date) | undefined;
}

export class LocalArtifactStorage implements ArtifactStorage {
  private readonly rootDirectory: string;
  private readonly publicBaseUrl: string;
  private readonly now: () => Date;

  constructor(options: LocalArtifactStorageOptions) {
    this.rootDirectory = resolve(options.rootDirectory);
    this.publicBaseUrl = (options.publicBaseUrl ?? "/api/v1/artifacts/content").replace(/\/$/, "");
    this.now = options.now ?? (() => new Date());
  }

  async write(input: ArtifactStorageWriteInput): Promise<StoredArtifactObject> {
    this.assertSegment(input.journeyId);
    this.assertSegment(input.artifactId);
    if (!Number.isInteger(input.version) || input.version < 1) {
      throw new ArtifactStoragePathError(String(input.version));
    }

    const safeName = this.safeFileName(input.fileName);
    const extension = extname(safeName);
    const storedName = extension ? `content${extension.toLowerCase()}` : "content.bin";
    const relativePath = join("journeys", input.journeyId, "artifacts", input.artifactId, `v${input.version}`, storedName);
    const absolutePath = this.resolveInsideRoot(relativePath);
    const manifestPath = `${absolutePath}${MANIFEST_SUFFIX}`;
    const checksum = this.checksum(input.content);

    await mkdir(dirname(absolutePath), { recursive: true });

    if (await this.fileExists(absolutePath)) {
      const current = await readFile(absolutePath);
      if (this.checksum(current) !== checksum) {
        throw new ArtifactStorageConflictError(this.toPortable(relativePath));
      }
      return this.readManifest(manifestPath);
    }

    const tempPath = `${absolutePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, input.content, { flag: "wx" });
    await rename(tempPath, absolutePath);

    const createdAt = this.now().toISOString();
    const stored: StoredArtifactObject = Object.freeze({
      journeyId: input.journeyId,
      artifactId: input.artifactId,
      version: input.version,
      fileName: safeName,
      relativePath: this.toPortable(relativePath),
      absolutePath,
      uri: `${this.publicBaseUrl}/${encodeURIComponent(this.toPortable(relativePath))}`,
      sizeBytes: input.content.byteLength,
      checksum,
      ...(input.mimeType === undefined ? {} : { mimeType: input.mimeType }),
      createdAt,
    });

    await this.atomicJsonWrite(manifestPath, stored);
    return stored;
  }

  async read(relativePath: string): Promise<Uint8Array> {
    const absolutePath = this.resolveInsideRoot(relativePath);
    try {
      return await readFile(absolutePath);
    } catch (error) {
      if (this.isNotFound(error)) throw new ArtifactStorageNotFoundError(relativePath);
      throw error;
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    return this.fileExists(this.resolveInsideRoot(relativePath));
  }

  async delete(relativePath: string): Promise<boolean> {
    const absolutePath = this.resolveInsideRoot(relativePath);
    if (!(await this.fileExists(absolutePath))) return false;
    await rm(absolutePath, { force: true });
    await rm(`${absolutePath}${MANIFEST_SUFFIX}`, { force: true });
    return true;
  }

  async listByJourney(journeyId: string): Promise<readonly StoredArtifactObject[]> {
    this.assertSegment(journeyId);
    const journeyRoot = this.resolveInsideRoot(join("journeys", journeyId, "artifacts"));
    if (!(await this.fileExists(journeyRoot))) return [];

    const manifests = await this.walkManifests(journeyRoot);
    const records = await Promise.all(manifests.map((path) => this.readManifest(path)));
    return records.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  private checksum(content: Uint8Array): string {
    return createHash("sha256").update(content).digest("hex");
  }

  private safeFileName(fileName: string): string {
    const value = fileName.trim();
    if (!value || value.includes("/") || value.includes("\\") || value === "." || value === "..") {
      throw new ArtifactStoragePathError(fileName);
    }
    return value.replace(/[^a-zA-Z0-9._-]/g, "-");
  }

  private assertSegment(value: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new ArtifactStoragePathError(value);
  }

  private resolveInsideRoot(value: string): string {
    if (!value || value.includes("\0")) throw new ArtifactStoragePathError(value);
    const target = resolve(this.rootDirectory, value);
    const prefix = `${this.rootDirectory}${sep}`;
    if (target !== this.rootDirectory && !target.startsWith(prefix)) {
      throw new ArtifactStoragePathError(value);
    }
    return target;
  }

  private toPortable(value: string): string {
    return value.split(sep).join("/");
  }

  private async atomicJsonWrite(path: string, value: unknown): Promise<void> {
    const tempPath = `${path}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(tempPath, path);
  }

  private async readManifest(path: string): Promise<StoredArtifactObject> {
    const raw = await readFile(path, "utf8");
    return Object.freeze(JSON.parse(raw) as StoredArtifactObject);
  }

  private async walkManifests(root: string): Promise<string[]> {
    const result: string[] = [];
    const entries = await readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(root, entry.name);
      if (entry.isDirectory()) result.push(...await this.walkManifests(path));
      else if (entry.isFile() && entry.name.endsWith(MANIFEST_SUFFIX)) result.push(path);
    }
    return result;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private isNotFound(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
  }
}
