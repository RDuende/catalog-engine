export type CanonicalProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED" | "DRAFT";

export interface CanonicalMediaInput {
  url: string;
  type?: "IMAGE" | "VIDEO" | "DOCUMENT" | "PDF";
  altText?: string;
  isPrimary?: boolean;
  position?: number;
  metadata?: Record<string, unknown>;
}

export interface CanonicalVariantInput {
  externalId?: string;
  sku: string;
  name?: string;
  barcode?: string;
  color?: string;
  size?: string;
  material?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CanonicalProductInput {
  providerKey: string;
  externalId: string;
  sku?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  material?: string;
  color?: string;
  dimensions?: string;
  weight?: number;
  customizable?: boolean;
  status?: CanonicalProductStatus;
  sourceUpdatedAt?: string;
  categories?: string[];
  tags?: string[];
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  variants?: CanonicalVariantInput[];
  media?: CanonicalMediaInput[];
}

export interface CanonicalUpsertResult {
  id: string;
  providerKey: string;
  externalId: string;
  action: "CREATED" | "UPDATED" | "UNCHANGED";
  contentHash: string;
}

export interface CanonicalImportResult {
  received: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  results: CanonicalUpsertResult[];
  errors: Array<{ externalId?: string; message: string }>;
}
