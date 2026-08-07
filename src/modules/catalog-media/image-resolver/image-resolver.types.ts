export type ResolvedImageKind =
  | "PRIMARY"
  | "GALLERY"
  | "DETAIL"
  | "COLOR_VARIANT"
  | "PACKAGING"
  | "THUMBNAIL"
  | "PREVIEW"
  | "ICON"
  | "DUPLICATE"
  | "UNKNOWN";

export interface CatalogImageCandidate {
  readonly id?: string;
  readonly url: string;
  readonly providerUrl?: string;
  readonly localPublicUrl?: string;
  readonly localFilename?: string;
  readonly sha256?: string;
  readonly width?: number;
  readonly height?: number;
  readonly position?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ResolvedImage {
  readonly key: string;
  readonly sourceUrl: string;
  readonly publicUrl: string;
  readonly kind: ResolvedImageKind;
  readonly score: number;
  readonly width?: number;
  readonly height?: number;
  readonly position: number;
  readonly selected: boolean;
  readonly reason: string;
}

export interface ImageResolutionResult {
  readonly selected: readonly ResolvedImage[];
  readonly all: readonly ResolvedImage[];
  readonly diagnostics: {
    readonly totalCandidates: number;
    readonly selectedCount: number;
    readonly discardedCount: number;
    readonly duplicateCount: number;
    readonly thumbnailCount: number;
    readonly previewCount: number;
    readonly iconCount: number;
  };
}
