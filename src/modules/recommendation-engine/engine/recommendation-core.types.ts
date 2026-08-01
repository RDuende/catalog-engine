export interface RecommendationContext {
  readonly query: string;
  readonly budget?: number;
  readonly quantity: number;
  readonly currency: string;
  readonly customizable?: boolean;
  readonly sustainability?: boolean;
  readonly sector?: string;
  readonly campaign?: string;
  readonly audience?: string;
  readonly profile?: string;
  readonly pipeline?: string;
  readonly profileTerms?: readonly string[];
  readonly weights?: Readonly<Record<string, number>>;
  readonly sustainableTerms?: readonly string[];
  readonly premiumTerms?: readonly string[];
  readonly campaignTerms?: Readonly<Record<string, readonly string[]>>;
}

export interface RecommendationCandidate {
  readonly productId: string;
  readonly name: string;
  readonly searchableText: string;
  readonly unitPrice: number | null;
  readonly customizable: boolean;
  readonly popularityScore: number;
  readonly categories: readonly string[];
  readonly knowledge: readonly string[];
  readonly memoryScore?: number;
  readonly memoryEvidence?: readonly string[];
}

export type RecommendationRuleCategory =
  | "relevance" | "budget" | "personalization" | "sustainability" | "popularity"
  | "sector" | "campaign" | "premium" | "memory";

export interface RecommendationRuleResult {
  readonly ruleId: string;
  readonly category: RecommendationRuleCategory;
  readonly points: number;
  readonly rawPoints?: number;
  readonly weight?: number;
  readonly reason?: string;
  readonly warning?: string;
  readonly matched: boolean;
}

export interface RecommendationRule {
  readonly id: string;
  applies(context: RecommendationContext): boolean;
  evaluate(candidate: RecommendationCandidate, context: RecommendationContext): RecommendationRuleResult;
}

export interface RecommendationEvaluation {
  readonly candidate: RecommendationCandidate;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly factors: readonly RecommendationRuleResult[];
}
