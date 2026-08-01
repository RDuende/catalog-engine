import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import { PgCommercialMemoryRepository, type CommercialMemoryRepository } from "./commercial-memory.repository.js";
import type { CommercialFeedbackInput } from "./commercial-memory.types.js";

export class CommercialMemoryService {
  constructor(private readonly repository: CommercialMemoryRepository = new PgCommercialMemoryRepository()) {}
  recordRecommendation(request: RecommendationRequest, response: RecommendationResponse): Promise<string> { return this.repository.recordRecommendation(request, response); }
  recordFeedback(input: CommercialFeedbackInput): Promise<void> { return this.repository.recordFeedback(input); }
  stats() { return this.repository.stats(); }
  history(limit = 20) { return this.repository.history(Math.min(100, Math.max(1, limit))); }
  productSignals(productIds: readonly string[], profile?: string) { return this.repository.productSignals(productIds, profile); }
}
