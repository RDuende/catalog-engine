import type { RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { ProposalPricingResult } from "../proposal-pricing/proposal-pricing.types.js";
import type { ProductionPlan } from "../production-intelligence/production-intelligence.types.js";
import type { AITrace, ConversationPatch, ConversationUnderstanding } from "../ai-gateway/ai-gateway.types.js";

export type SalesIntent = "DISCOVER" | "RECOMMEND" | "COMPARE" | "REFINE_BUDGET" | "SELECT" | "PROPOSAL";

export type ConversationState = "WELCOME" | "DISCOVERY" | "COLLECT_REQUIREMENTS" | "SEARCH_PRODUCTS" | "COMPARE_OPTIONS" | "BUILD_PROPOSAL" | "CONFIRM" | "FINISHED";
export type RequirementField = "need" | "businessGoal" | "audience" | "quantity" | "budget" | "currency" | "sector" | "campaign" | "sustainability" | "customizable" | "deadline";

export interface SalesBrainContext {
  readonly need?: string;
  readonly businessGoal?: string;
  readonly quantity?: number;
  readonly budget?: number;
  readonly currency?: string;
  readonly sector?: string;
  readonly campaign?: string;
  readonly audience?: string;
  readonly sustainability?: boolean;
  readonly customizable?: boolean;
  readonly providerKey?: string;
  readonly profile?: string;
  readonly selectedProductId?: string;
  readonly deadline?: string;
  readonly conversationState?: ConversationState;
  readonly pendingField?: RequirementField;
  readonly confidence?: Readonly<Record<string, number>>;
}

export interface SalesBrainAnalysis {
  readonly intent: SalesIntent;
  readonly confidence: number;
  readonly context: SalesBrainContext;
  readonly missingFields: readonly string[];
  readonly questions: readonly string[];
  readonly shouldRecommend: boolean;
  readonly shouldGenerateProposal: boolean;
}

export interface ProposalLine {
  readonly productId: string;
  readonly name: string;
  readonly sku: string | null;
  readonly quantity: number;
  readonly unitPrice: number | null;
  readonly total: number | null;
  readonly currency: string;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly pricing?: ProposalPricingResult;
  readonly production?: ProductionPlan;
}

export interface SalesProposal {
  readonly title: string;
  readonly summary: string;
  readonly quantity: number;
  readonly currency: string;
  readonly budgetPerUnit?: number;
  readonly lines: readonly ProposalLine[];
  readonly estimatedTotal: number | null;
  readonly estimatedTotalWithVat?: number | null;
  readonly assumptions: readonly string[];
  readonly nextActions: readonly string[];
}

export interface SalesBrainDecision {
  readonly strategy: "ASK" | "RECOMMEND" | "COMPARE" | "PROPOSE";
  readonly rationale: readonly string[];
  readonly analysis: SalesBrainAnalysis;
  readonly recommendation?: RecommendationResponse;
  readonly proposal?: SalesProposal;
  readonly conversationAI?: { readonly understanding: ConversationUnderstanding; readonly trace: AITrace; readonly fallbackUsed: boolean; readonly appliedPatches: readonly ConversationPatch[]; };
  readonly reply?: string;
}

export interface SalesBrainRequest {
  readonly message: string;
  readonly context?: SalesBrainContext;
  readonly limit?: number;
  readonly recommendNow?: boolean;
  readonly recommendation?: RecommendationResponse;
}
