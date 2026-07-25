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
  readonly description?: string;
  supports(filePath: string, configuration?: Record<string, unknown>): boolean;
  read(context: ImportAdapterContext): AsyncIterable<RawImportRecord>;
  normalize(record: RawImportRecord, context: ImportAdapterContext): NormalizedProduct | null;
}

export interface ImportAnalysis {
  adapter: { key: string; name: string };
  file: { path: string; name: string; sizeBytes: number };
  totals: {
    records: number;
    normalizable: number;
    skipped: number;
    invalid: number;
  };
  detected: {
    fields: string[];
    categories: string[];
    productTypes: string[];
    materials: string[];
    colors: string[];
    hasImages: boolean;
    hasVariants: boolean;
  };
  errors: Array<{ row: number; message: string }>;
  sample: NormalizedProduct[];
  readyToImport: boolean;
}

export interface RunImportInput {
  sourceId: string;
  filePath: string;
  adapter?: string;
  dryRun?: boolean;
  limit?: number;
}

export interface AnalyzeImportInput {
  filePath: string;
  adapter?: string;
  configuration?: Record<string, unknown>;
  limit?: number;
  sampleSize?: number;
}
