import path from "node:path";
import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { makitoFetchBinary } from "../provider-engine/makito-client.js";
import { LocalCatalogMediaStorage, safeMediaSegment } from "./catalog-media.storage.js";
import type { CatalogMediaDownload, CatalogMediaSyncOptions, CatalogMediaSyncResult } from "./catalog-media.types.js";

interface MediaRow {
  id: string;
  url: string;
  metadata: Record<string, unknown> | null;
  provider_key: string;
  sku: string | null;
  external_id: string;
}

type BinaryDownloader = (url: string) => Promise<CatalogMediaDownload>;

function extensionFrom(contentType: string, sourceUrl: string): string {
  const pathnameExtension = path.extname(new URL(sourceUrl).pathname).toLowerCase();
  if (/^\.[a-z0-9]{2,5}$/.test(pathnameExtension)) return pathnameExtension;
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  return ".jpg";
}

function originalProviderUrl(row: MediaRow): string | undefined {
  const metadataUrl = row.metadata?.providerUrl;
  if (typeof metadataUrl === "string" && /^https?:\/\//i.test(metadataUrl)) return metadataUrl;
  return /^https?:\/\//i.test(row.url) ? row.url : undefined;
}

export class CatalogMediaService {
  constructor(
    private readonly pool: Pool = canonicalPool(),
    readonly storage = new LocalCatalogMediaStorage(),
    private readonly downloadMakito: BinaryDownloader = async url => makitoFetchBinary({}, url),
  ) {}

  async sync(options: CatalogMediaSyncOptions = {}): Promise<CatalogMediaSyncResult> {
    const providerKey = options.providerKey ?? "makito";
    const limit = Math.max(1, Math.min(options.limit ?? 100_000, 100_000));
    const result = await this.pool.query<MediaRow>(`
      SELECT m.id, m.url, m.metadata, p.provider_key, p.sku, p.external_id
      FROM canonical_media m
      JOIN canonical_products p ON p.id=m.product_id
      WHERE p.provider_key=$1 AND m.type='IMAGE'
      ORDER BY p.sku, m.position, m.id
      LIMIT $2
    `, [providerKey, limit]);

    const rows = result.rows;
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    let totalBytes = 0;
    const errors: Array<{ mediaId: string; sku: string; message: string }> = [];
    const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 12));
    let cursor = 0;
    let completed = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const index = cursor++;
        const row = rows[index];
        if (!row) return;
        const sku = row.sku ?? row.external_id;
        try {
          const providerUrl = originalProviderUrl(row);
          if (!providerUrl) {
            skipped += 1;
            continue;
          }
          const existingFilename = typeof row.metadata?.localFilename === "string" ? row.metadata.localFilename : undefined;
          if (!options.force && existingFilename && await this.storage.exists(providerKey, sku, existingFilename)) {
            skipped += 1;
            continue;
          }

          if (providerKey !== "makito") throw new Error(`No hay descargador autenticado configurado para ${providerKey}.`);
          const media = await this.downloadMakito(providerUrl);
          const sourceExtension = path.extname(new URL(providerUrl).pathname).toLowerCase();
          const imageByExtension = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(sourceExtension);
          if (!media.contentType.toLowerCase().startsWith("image/") && !imageByExtension) {
            throw new Error(`El recurso no es una imagen (${media.contentType || "content-type desconocido"}).`);
          }
          const filename = `${safeMediaSegment(row.id)}${extensionFrom(media.contentType, providerUrl)}`;
          await this.storage.save(providerKey, sku, filename, media.bytes);
          const publicUrl = `/api/v1/catalog-media/${encodeURIComponent(providerKey)}/${encodeURIComponent(sku)}/${encodeURIComponent(filename)}`;
          await this.pool.query(`
            UPDATE canonical_media
            SET url=$2,
                metadata=COALESCE(metadata, '{}'::jsonb) || $3::jsonb
            WHERE id=$1
          `, [row.id, publicUrl, JSON.stringify({
            providerUrl,
            localFilename: filename,
            localPublicUrl: publicUrl,
            localContentType: media.contentType,
            localBytes: media.bytes.length,
            downloadedAt: new Date().toISOString(),
          })]);
          downloaded += 1;
          totalBytes += media.bytes.length;
        } catch (error) {
          failed += 1;
          errors.push({ mediaId: row.id, sku, message: error instanceof Error ? error.message : String(error) });
        } finally {
          completed += 1;
          options.onProgress?.(completed, rows.length);
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, rows.length || 1) }, () => worker()));
    return Object.freeze({ scanned: rows.length, downloaded, skipped, failed, bytes: totalBytes, errors: Object.freeze(errors) });
  }
}
