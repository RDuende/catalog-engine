import type { SourceLocation } from "../document/document-model.js";

export type CanonicalSeverity = "info" | "warning" | "error";

export interface CanonicalDiagnostic {
  severity: CanonicalSeverity;
  code: string;
  message: string;
  productId?: string;
  location?: SourceLocation;
}

export interface CanonicalMoney {
  amountMinor: number;
  currency: "EUR";
  formatted: string;
}

export interface CanonicalTaxonomyTerm {
  label: string;
  normalized: string;
}

export interface CanonicalProductSource {
  sourceFile: string;
  provider?: string;
  semanticProductId: string;
  rawText: string;
  location: SourceLocation;
}

export interface CanonicalProduct {
  id: string;
  sku: string;
  supplier?: string;
  supplierSku: string;
  name: string;
  description?: string;
  categories: CanonicalTaxonomyTerm[];
  materials: CanonicalTaxonomyTerm[];
  techniques: CanonicalTaxonomyTerm[];
  dimensions: string[];
  prices: CanonicalMoney[];
  tags: string[];
  valid: boolean;
  confidence: number;
  warnings: string[];
  source: CanonicalProductSource;
}

export interface CanonicalCatalog {
  kind: "CanonicalCatalog";
  schemaVersion: "1.0";
  sourceFile: string;
  provider?: string;
  products: CanonicalProduct[];
  diagnostics: CanonicalDiagnostic[];
  statistics: {
    totalProducts: number;
    validProducts: number;
    invalidProducts: number;
    averageConfidence: number;
  };
}
