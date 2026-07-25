import type { DomainEvent } from "../../core/events/domain-events.js";
import { recommendationCompletedEvent } from "./recommendation.events.js";
import { PrismaRecommendationCandidateRepository } from "./recommendation.repository.js";
import { scoreRecommendationCandidate } from "./recommendation.scoring.js";
import type {
  RecommendationCandidateRepository,
  RecommendationQuery,
  RecommendationResult
} from "./recommendation.types.js";

export interface RecommendationEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export interface RecommendationEngineOptions {
  readonly repository?: RecommendationCandidateRepository;
  readonly eventPublisher?: RecommendationEventPublisher;
}

export class RecommendationEngine {
  private readonly repository: RecommendationCandidateRepository;
  private readonly eventPublisher?: RecommendationEventPublisher;

  constructor(options: RecommendationEngineOptions = {}) {
    this.repository = options.repository ?? new PrismaRecommendationCandidateRepository();
    this.eventPublisher = options.eventPublisher;
  }

  async recommend(query: RecommendationQuery): Promise<RecommendationResult> {
    this.validateQuery(query);
    const candidates = await this.repository.findCandidates(query);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const items = candidates
      .map((candidate) => scoreRecommendationCandidate(candidate, query))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "es"))
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const result: RecommendationResult = {
      generatedAt: new Date(),
      query,
      totalCandidates: candidates.length,
      items
    };

    await this.eventPublisher?.publish(recommendationCompletedEvent({
      totalCandidates: candidates.length,
      returnedItems: items.length,
      topScore: items.at(0)?.score ?? null
    }));

    return result;
  }

  private validateQuery(query: RecommendationQuery): void {
    if (query.budgetMin !== undefined && query.budgetMin < 0) throw new Error("budgetMin no puede ser negativo.");
    if (query.budgetMax !== undefined && query.budgetMax < 0) throw new Error("budgetMax no puede ser negativo.");
    if (query.budgetMin !== undefined && query.budgetMax !== undefined && query.budgetMin > query.budgetMax) {
      throw new Error("budgetMin no puede ser mayor que budgetMax.");
    }
    if (query.quantity !== undefined && (!Number.isInteger(query.quantity) || query.quantity < 1)) {
      throw new Error("quantity debe ser un entero mayor que cero.");
    }
  }
}
