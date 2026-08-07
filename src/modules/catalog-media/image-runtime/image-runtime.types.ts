import type {
  CatalogImageCandidate,
  ImageResolutionResult,
  ResolvedImage,
} from "../image-resolver/index.js";

export interface RuntimeProductImageInput {
  readonly productId: string;
  readonly providerKey?: string;
  readonly sku?: string;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly media?: readonly unknown[];
}

export interface RuntimeProductImageResult {
  readonly productId: string;
  readonly imageUrl?: string;
  readonly images: readonly string[];
  readonly primary?: ResolvedImage;
  readonly resolution: ImageResolutionResult;
}

export interface RuntimeImageCarrier {
  readonly id?: string;
  readonly productId?: string;
  readonly sku?: string;
  readonly providerKey?: string;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly media?: readonly unknown[];
  readonly [key: string]: unknown;
}

export type RuntimeImageCandidate =
  CatalogImageCandidate;
