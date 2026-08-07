import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SAFE_SEGMENT = /[^a-zA-Z0-9._-]+/g;

export function safeMediaSegment(value: string): string {
  const safe = value.trim().replace(SAFE_SEGMENT, "-").replace(/^-+|-+$/g, "");
  return safe || "unknown";
}

export class LocalCatalogMediaStorage {
  readonly rootDirectory: string;

  constructor(rootDirectory = process.env.CATALOG_MEDIA_DIR ?? ".data/catalog-media") {
    this.rootDirectory = path.resolve(rootDirectory);
  }

  resolve(providerKey: string, sku: string, filename: string): string {
    return path.join(
      this.rootDirectory,
      safeMediaSegment(providerKey),
      safeMediaSegment(sku),
      safeMediaSegment(filename),
    );
  }

  async save(providerKey: string, sku: string, filename: string, bytes: Buffer): Promise<string> {
    const target = this.resolve(providerKey, sku, filename);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return target;
  }

  async read(providerKey: string, sku: string, filename: string): Promise<Buffer> {
    return readFile(this.resolve(providerKey, sku, filename));
  }

  async exists(providerKey: string, sku: string, filename: string): Promise<boolean> {
    try {
      return (await stat(this.resolve(providerKey, sku, filename))).isFile();
    } catch {
      return false;
    }
  }
}
