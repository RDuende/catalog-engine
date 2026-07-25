import type { DocumentBlock, DocumentBlockType } from "../block-detector/index.js";

export type CatalogPatternType = "PRODUCT" | "CATEGORY" | "TABLE" | "HEADER" | "FOOTER" | "TEXT" | "UNKNOWN";

export interface PriceTierCandidate { quantity?: number; price: number; currency: "EUR"; raw: string; }
export interface ProductFieldCandidates {
  reference?: string;
  name?: string;
  description?: string;
  dimensions?: string[];
  materials?: string[];
  colors?: string[];
  markingCodes?: string[];
  prices?: PriceTierCandidate[];
  rawLines: string[];
}
export interface PatternMatch {
  blockId: string;
  page: number;
  sourceType: DocumentBlockType;
  pattern: CatalogPatternType;
  confidence: number;
  signals: string[];
  fields: ProductFieldCandidates;
}
export interface PatternEngineResult {
  matches: PatternMatch[];
  statistics: { total: number; byPattern: Record<CatalogPatternType, number>; averageConfidence: number; };
}
export interface PatternRuleContext { block: DocumentBlock; lines: string[]; }
export interface PatternRuleResult { score: number; signals?: string[]; }
export interface PatternRule { readonly id: string; readonly pattern: CatalogPatternType; evaluate(context: PatternRuleContext): PatternRuleResult; }
