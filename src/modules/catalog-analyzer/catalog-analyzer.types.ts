export type PageKind =
  | "PRODUCT"
  | "CATEGORY"
  | "INDEX"
  | "INTRO"
  | "LEGAL"
  | "BACK_COVER"
  | "UNKNOWN";

export interface CatalogPage {
  page: number;
  text: string;
}

export interface PageSignals {
  references: string[];
  prices: string[];
  printCodes: string[];
  dimensions: string[];
  packaging: string[];
  languages: string[];
  categoryCandidates: string[];
}

export interface AnalyzedPage {
  page: number;
  kind: PageKind;
  confidence: number;
  textLength: number;
  signals: PageSignals;
  warnings: string[];
}

export interface AnalyzerTotals {
  pages: number;
  pagesByKind: Record<PageKind, number>;
  productPages: number;
  categoryPages: number;
  references: number;
  uniqueReferences: number;
  prices: number;
  printCodes: number;
  dimensions: number;
  packagingMentions: number;
  categories: number;
  languages: string[];
  warnings: number;
}

export interface CatalogDiagnostics {
  duplicateReferences: Array<{ reference: string; pages: number[] }>;
  productPagesWithoutReferences: number[];
  productPagesWithoutPrices: number[];
  emptyPages: number[];
  unknownPages: number[];
}

export interface CatalogAnalyzerReport {
  analyzerVersion: string;
  sourceFile: string;
  sourceHash: string;
  provider: string;
  generatedAt: string;
  elapsedMs: number;
  confidence: number;
  totals: AnalyzerTotals;
  categories: string[];
  diagnostics: CatalogDiagnostics;
  warnings: Array<{ page: number; messages: string[] }>;
  pages: AnalyzedPage[];
}
