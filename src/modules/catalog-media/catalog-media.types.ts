export interface CatalogMediaDownload {
  readonly bytes: Buffer;
  readonly contentType: string;
  readonly sourceUrl: string;
}

export interface CatalogMediaSyncOptions {
  readonly providerKey?: string;
  readonly limit?: number;
  readonly concurrency?: number;
  readonly force?: boolean;
  readonly onProgress?: (completed: number, total: number) => void;
}

export interface CatalogMediaSyncResult {
  readonly scanned: number;
  readonly downloaded: number;
  readonly skipped: number;
  readonly failed: number;
  readonly bytes: number;
  readonly errors: readonly { mediaId: string; sku: string; message: string }[];
}
