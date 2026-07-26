import type { AttributeType } from "../knowledge/model.js";
import type { RecommendationCriteria } from "../recommendation/model.js";

export type IntentPriority = "normal" | "high";

export interface ParsedIntent {
  rawText: string;
  normalizedText: string;
  recipient?: string;
  occasion?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  quantity?: number;
  personalization?: boolean;
  priority: IntentPriority;
  attributes: Partial<Record<AttributeType, string[]>>;
  terms: string[];
  confidence: number;
  warnings: string[];
}

export interface IntentParseOptions {
  defaultLimit?: number;
  validOnly?: boolean;
  minimumScore?: number;
}

export interface ResolvedEntity {
  type: AttributeType;
  canonical: string;
  matched: string;
  confidence: number;
}

export interface IntentAnalysis {
  intent: ParsedIntent;
  criteria: RecommendationCriteria;
}
