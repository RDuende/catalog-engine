import type { RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { CommercialContext } from "../../core/commercial-context/index.js";

export type RaiCommercialContext = CommercialContext;

export interface RaiCommercialState extends RaiCommercialContext {
  readonly need?: string;
  readonly messages: readonly string[];
  readonly lastRecommendationRunId?: string;
  readonly selectedProductId?: string;
}

export interface RaiCommercialChatRequest {
  readonly message: string;
  readonly sessionId?: string;
  readonly context?: RaiCommercialContext;
  readonly limit?: number;
  readonly recommendNow?: boolean;
}

export interface RaiCommercialChatResponse {
  readonly sessionId: string;
  readonly status: "question" | "recommendation" | "no_results" | "selected";
  readonly reply: string;
  readonly state: RaiCommercialState;
  readonly missingFields: readonly string[];
  readonly recommendation?: RecommendationResponse;
  readonly fallbackApplied?: "budget_removed";
}
