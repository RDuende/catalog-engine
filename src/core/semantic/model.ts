import type { SourceLocation } from "../document/document-model.js";

export type SemanticSeverity = "info" | "warning" | "error";

export interface SemanticDiagnostic {
  severity: SemanticSeverity;
  code: string;
  message: string;
  productId?: string;
  location?: SourceLocation;
}

export interface MoneyValue {
  amountMinor: number;
  currency: "EUR";
  formatted: string;
}

export interface SemanticProduct {
  id: string;
  reference?: string;
  name?: string;
  description?: string;
  prices: MoneyValue[];
  dimensions: string[];
  materials: string[];
  techniques: string[];
  category?: string;
  valid: boolean;
  confidence: number;
  missing: Array<"reference" | "name">;
  warnings: string[];
  source: {
    rawText: string;
    location: SourceLocation;
  };
}

export interface SemanticCatalog {
  kind: "SemanticCatalog";
  sourceFile: string;
  products: SemanticProduct[];
  categories: string[];
  diagnostics: SemanticDiagnostic[];
  statistics: {
    validProducts: number;
    invalidProducts: number;
    ignoredTextNodes: number;
    averageConfidence: number;
  };
}
