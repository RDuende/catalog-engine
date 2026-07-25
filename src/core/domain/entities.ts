import type { EntityId } from "../shared/ids.js";
import type { Barcode, Dimensions, HexColor, LocaleCode, Money, Sku, Weight } from "./value-objects.js";

export type EntityBase = Readonly<{ id: EntityId; createdAt: Date; updatedAt: Date }>;
export type LifecycleStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "DISCONTINUED";

export type Provider = EntityBase & Readonly<{
  name: string;
  slug: string;
  active: boolean;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type Catalog = EntityBase & Readonly<{
  providerId: EntityId;
  name: string;
  code: string;
  locale: LocaleCode;
  active: boolean;
}>;

export type CatalogVersion = EntityBase & Readonly<{
  catalogId: EntityId;
  version: string;
  validFrom?: Date;
  validTo?: Date;
  sourceHash?: string;
}>;

export type Brand = EntityBase & Readonly<{ name: string; slug: string; website?: string }>;
export type Category = EntityBase & Readonly<{ name: string; slug: string; parentId?: EntityId; active: boolean }>;
export type Material = EntityBase & Readonly<{ name: string; slug: string; sustainable?: boolean }>;
export type Technique = EntityBase & Readonly<{ name: string; code: string; active: boolean }>;
export type Audience = EntityBase & Readonly<{ name: string; slug: string }>;
export type Occasion = EntityBase & Readonly<{ name: string; slug: string }>;

export type AssetKind = "IMAGE" | "VIDEO" | "DOCUMENT" | "PDF";
export type Asset = EntityBase & Readonly<{
  kind: AssetKind;
  uri: string;
  mimeType: string;
  hash?: string;
  width?: number;
  height?: number;
}>;

export type Variant = EntityBase & Readonly<{
  productId: EntityId;
  sku: Sku;
  barcode?: Barcode;
  name?: string;
  color?: HexColor;
  dimensions?: Dimensions;
  weight?: Weight;
  cost?: Money;
  retailPrice?: Money;
  stock?: number;
  status: LifecycleStatus;
}>;

export type Product = EntityBase & Readonly<{
  providerId: EntityId;
  catalogVersionId?: EntityId;
  brandId?: EntityId;
  name: string;
  slug: string;
  description?: string;
  status: LifecycleStatus;
  categoryIds: readonly EntityId[];
  materialIds: readonly EntityId[];
  techniqueIds: readonly EntityId[];
  audienceIds: readonly EntityId[];
  occasionIds: readonly EntityId[];
  assetIds: readonly EntityId[];
  variantIds: readonly EntityId[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ImportJobStatus = "PENDING" | "QUEUED" | "ANALYZING" | "IMPORTING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type ImportJob = EntityBase & Readonly<{
  providerId: EntityId;
  catalogId?: EntityId;
  status: ImportJobStatus;
  progress: number;
  sourceName: string;
  sourceHash?: string;
  error?: string;
}>;

export type RecommendationReason = Readonly<{ code: string; label: string; score: number; evidence?: unknown }>;
export type Recommendation = EntityBase & Readonly<{
  query: string;
  productId: EntityId;
  score: number;
  reasons: readonly RecommendationReason[];
  context?: Readonly<Record<string, unknown>>;
}>;
