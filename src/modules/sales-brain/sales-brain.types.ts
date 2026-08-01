import type { RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { ProposalPricingResult } from "../proposal-pricing/proposal-pricing.types.js";
import type { ProductionPlan } from "../production-intelligence/production-intelligence.types.js";
import type { AITrace, ConversationUnderstanding } from "../ai-gateway/ai-gateway.types.js";
import type { CommercialContext, CommercialContextField, ContextPatch, ConversationState } from "../../core/commercial-context/index.js";

export type SalesIntent = "DISCOVER" | "RECOMMEND" | "COMPARE" | "REFINE_BUDGET" | "SELECT" | "PROPOSAL";

export type RequirementField = CommercialContextField;
export type SalesBrainContext = CommercialContext;

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
  readonly conversationAI?: { readonly understanding: ConversationUnderstanding; readonly trace: AITrace; readonly fallbackUsed: boolean; readonly appliedPatches: readonly ContextPatch[]; };
  readonly reply?: string;
}

export interface SalesBrainRequest {
  readonly message: string;
  readonly context?: SalesBrainContext;
  readonly limit?: number;
  readonly recommendNow?: boolean;
  readonly recommendation?: RecommendationResponse;
}
