export interface MakitoImageReference {
  readonly productId: string;
  readonly sku?: string;
  readonly kind:
    | "PRIMARY"
    | "THUMBNAIL"
    | "DETAIL"
    | "VARIANT"
    | "OTHER";
  readonly url: string;
  readonly position: number;
}

export interface MakitoStoredImage {
  readonly url: string;
  readonly sha256: string;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly contentType: string;
  readonly byteLength: number;
  readonly downloadedAt: string;
}

export interface MakitoImageFailure {
  readonly url: string;
  readonly productId: string;
  readonly kind: MakitoImageReference["kind"];
  readonly statusCode?: number;
  readonly message: string;
  readonly attempts: number;
}

export interface MakitoImageManifest {
  readonly version: "1.0";
  readonly generatedAt: string;
  readonly snapshotPath: string;
  readonly storageRoot: string;
  readonly totalProducts: number;
  readonly totalReferences: number;
  readonly uniqueUrls: number;
  readonly downloaded: number;
  readonly reused: number;
  readonly failures: readonly MakitoImageFailure[];
  readonly images: Readonly<Record<string, MakitoStoredImage>>;
}

export interface MakitoImageSyncOptions {
  readonly snapshotPath?: string;
  readonly outputCatalogPath?: string;
  readonly storageRoot?: string;
  readonly concurrency?: number;
  readonly retries?: number;
  readonly timeoutMs?: number;
  readonly dryRun?: boolean;
  readonly overwrite?: boolean;
}

export interface MakitoImageSyncProgress {
  readonly phase:
    | "DISCOVER"
    | "DOWNLOAD"
    | "WRITE_CATALOG"
    | "COMPLETE";
  readonly current: number;
  readonly total: number;
  readonly message: string;
}

export interface MakitoImageSyncResult {
  readonly manifestPath: string;
  readonly outputCatalogPath: string;
  readonly manifest: MakitoImageManifest;
}
