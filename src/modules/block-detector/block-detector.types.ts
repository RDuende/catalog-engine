export type DocumentBlockType =
  | "HEADER"
  | "FOOTER"
  | "CATEGORY"
  | "PRODUCT"
  | "TABLE"
  | "TEXT"
  | "UNKNOWN";

export interface CatalogPageInput {
  page: number;
  text: string;
}

export interface DocumentBlock {
  id: string;
  page: number;
  type: DocumentBlockType;
  startLine: number;
  endLine: number;
  text: string;
  confidence: number;
  signals: string[];
}

export interface BlockDetectorOptions {
  headerLines?: number;
  footerLines?: number;
  minimumBlockLines?: number;
  productReferencePatterns?: RegExp[];
}

export interface BlockDetectionResult {
  pages: number;
  blocks: DocumentBlock[];
  statistics: {
    total: number;
    byType: Record<DocumentBlockType, number>;
    averageConfidence: number;
  };
}
