import { normalizeRecommendationWeights } from "./recommendation.config.js";
import { recommendationCompletedEvent } from "./recommendation.events.js";
import { buildRecommendationReasons } from "./recommendation.explainer.js";
import { PrismaRecommendationCandidateRepository } from "./recommendation.repository.js";
import { scoreRecommendationCandidate } from "./recommendation.scoring.js";
import type {
  RecommendationCandidateRepository,
  RecommendationEventPublisher,
  RecommendationQuery,
  RecommendationResult,
  RecommendationResultItem,
  RecommendationWeights
} from "./recommendation.types.js";
import { roundScore } from "./recommendation.utils.js";

export interface RecommendationEngineOptions {
  readonly repository?: RecommendationCandidateRepository;
  readonly eventPublisher?: RecommendationEventPublisher;
  readonly weights?: Partial<RecommendationWeights>;
}

export class RecommendationEngine {
  private readonly repository: RecommendationCandidateRepository;
  private readonly eventPublisher?: RecommendationEventPublisher;
  private readonly weights: RecommendationWeights;

  constructor(options: RecommendationEngineOptions = {}) {
    this.repository = options.repository ?? new PrismaRecommendationCandidateRepository();
    this.eventPublisher = options.eventPublisher;
    this.weights = normalizeRecommendationWeights(options.weights);
  }

  async recommend(query: RecommendationQuery): Promise<RecommendationResult> {
    const startedAt = performance.now();
    const normalizedQuery: RecommendationQuery = {
      ...query,
      text: query.text.trim(),
      limit: Math.min(100, Math.max(1, query.limit ?? 20)),
      offset: Math.max(0, query.offset ?? 0),
      quantity: Math.max(1, query.quantity ?? 1),
      currency: (query.currency ?? "EUR").toUpperCase(),
      activeOnly: query.activeOnly ?? true
    };

    if (!normalizedQuery.text &&
        !normalizedQuery.categorySlugs?.length &&
        !normalizedQuery.knowledgeNodeSlugs?.length &&
        !normalizedQuery.customizationSlugs?.length) {
      throw new Error("La consulta de recomendación no puede estar vacía.");
    }

    const candidates = await this.repository.findCandidates(normalizedQuery);

    const ranked = candidates
      .map((candidate) => {
        const factors = scoreRecommendationCandidate(candidate, normalizedQuery, this.weights);
        const score = roundScore(
          factors.reduce((sum, factor) => sum + factor.contribution, 0) * 100
        );
        return { candidate, factors, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) =>
        right.score - left.score ||
        Number(right.candidate.featured) - Number(left.candidate.featured) ||
        right.candidate.popularityScore - left.candidate.popularityScore ||
        left.candidate.name.localeCompare(right.candidate.name, "es")
      );

    const offset = normalizedQuery.offset ?? 0;
    const limit = normalizedQuery.limit ?? 20;

    const items: RecommendationResultItem[] = ranked
      .slice(offset, offset + limit)
      .map(({ candidate, factors, score }, index) => ({
        rank: offset + index + 1,
        score,
        product: {
          id: candidate.id,
          sku: candidate.sku,
          name: candidate.name,
          slug: candidate.slug,
          shortDescription: candidate.shortDescription,
          customizable: candidate.customizable,
          featured: candidate.featured,
          selectedPrice: candidate.prices.at(0) ?? null,
          categories: candidate.categories
        },
        factors,
        reasons: buildRecommendationReasons(factors)
      }));

    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
    const result: RecommendationResult = {
      query: normalizedQuery,
      totalCandidates: candidates.length,
      returned: items.length,
      durationMs,
      items
    };

    await this.eventPublisher?.publish(recommendationCompletedEvent({
      query: normalizedQuery.text,
      candidates: candidates.length,
      results: items.length,
      durationMs
    }));

    return result;
  }
}
