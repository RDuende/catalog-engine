export type RawImportRecord = Record<string, unknown>;

export interface NormalizedVariant {
  sku: string;
  name?: string;
  barcode?: string;
  color?: string;
  size?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedMedia {
  url: string;
  type?: "IMAGE" | "VIDEO" | "DOCUMENT" | "PDF";
  fileName?: string;
  altText?: string;
  isPrimary?: boolean;
  position?: number;
  metadata?: Record<string, unknown>;
}

export interface NormalizedProduct {
  externalId: string;
  sku?: string;
  supplierReference?: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  productType?: string;
  primaryColor?: string;
  material?: string;
  weightGrams?: number;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  customizable?: boolean;
  categories?: string[];
  variants?: NormalizedVariant[];
  media?: NormalizedMedia[];
  metadata?: Record<string, unknown>;
}

export interface ImportAdapterContext {
  filePath: string;
  configuration?: Record<string, unknown>;
}

export interface ImportAdapter {
  readonly key: string;
  readonly name: string;
  supports(filePath: string, configuration?: Record<string, unknown>): boolean;
  read(context: ImportAdapterContext): AsyncIterable<RawImportRecord>;
  normalize(
    record: RawImportRecord,
    context: ImportAdapterContext
  ): NormalizedProduct | null;
}

export interface RunImportInput {
  sourceId: string;
  filePath: string;
  adapter?: string;
  dryRun?: boolean;
  limit?: number;
}
