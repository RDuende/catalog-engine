import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";

export type CommercialOutcome = "SHOWN" | "SHORTLISTED" | "QUOTED" | "ACCEPTED" | "REJECTED" | "PURCHASED";

export interface CommercialFeedbackInput {
  runId: string;
  productId: string;
  eventType: CommercialOutcome;
  value?: number;
  notes?: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface CommercialProductSignal {
  productId: string;
  score: number;
  evidence: string[];
  counts: Partial<Record<CommercialOutcome, number>>;
}

export interface CommercialMemoryRecorder {
  recordRecommendation(request: RecommendationRequest, response: RecommendationResponse): Promise<string>;
  productSignals?(productIds: readonly string[], profile?: string): Promise<Map<string, CommercialProductSignal>>;
}

export interface CommercialMemoryStats {
  runs: number;
  recommendations: number;
  shortlisted: number;
  quoted: number;
  accepted: number;
  rejected: number;
  purchased: number;
  conversionRate: number;
  byProfile: Record<string, number>;
  byOutcome: Record<string, number>;
}
