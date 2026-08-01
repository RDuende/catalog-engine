import { SemanticQueryService } from "../knowledge-graph-v2/semantic-query.service.js";
import { PgSemanticQueryRepository } from "../knowledge-graph-v2/semantic-query.repository.js";
import type { SemanticConstraint, SemanticRecommendation } from "../knowledge-graph-v2/semantic-query.types.js";
import { recommendationCompletedEvent } from "./recommendation.events.js";
import { RecommendationEngine } from "./engine/recommendation-engine.js";
import type { RecommendationCandidate, RecommendationContext } from "./engine/recommendation-core.types.js";
import { createCoreRecommendationRules } from "./rules/core.rules.js";
import { loadRecommendationConfig } from "./recommendation.config.js";
import { PgRecommendationRepository, type RecommendationProductRecord, type RecommendationRepository } from "./recommendation.repository.js";
import type { RecommendationEventPublisher, RecommendationRequest, RecommendationResponse, RecommendationItemResult } from "./recommendation.types.js";
import type { CommercialMemoryRecorder } from "../commercial-memory/commercial-memory.types.js";

export interface RecommendationServiceOptions {
  readonly eventPublisher?: RecommendationEventPublisher;
  readonly semanticService?: SemanticQueryService;
  readonly repository?: RecommendationRepository;
  readonly engine?: RecommendationEngine;
  readonly memory?: CommercialMemoryRecorder;
}

export class RecommendationService {
  private readonly eventPublisher?: RecommendationEventPublisher;
  private readonly semanticService: SemanticQueryService;
  private readonly repository: RecommendationRepository;
  private readonly engine: RecommendationEngine;
  private readonly memory?: CommercialMemoryRecorder;

  constructor(options: RecommendationServiceOptions = {}) {
    this.eventPublisher = options.eventPublisher;
    this.semanticService = options.semanticService ?? new SemanticQueryService(new PgSemanticQueryRepository());
    this.repository = options.repository ?? new PgRecommendationRepository();
    this.engine = options.engine ?? new RecommendationEngine(createCoreRecommendationRules());
    this.memory = options.memory;
  }

  async recommend(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startedAt = performance.now();
    const config = await loadRecommendationConfig();
    const profileKey = request.profile && config.profiles[request.profile] ? request.profile : "default";
    const profile = config.profiles[profileKey] ?? config.profiles.default!;
    const pipelineKey = request.pipeline && config.pipelines[request.pipeline] ? request.pipeline : profile.pipeline;
    const pipeline = config.pipelines[pipelineKey] ?? config.pipelines.general!;
    const limit = Math.min(50, Math.max(1, request.limit ?? 10));
    const retrievalLimit = Math.min(500, Math.max(limit * 10, 100));
    const constraints: SemanticConstraint[] = [
      ...(request.categorySlugs ?? []).map((term) => ({ term, type: "CATEGORY" as const, mode: "SHOULD" as const })),
      ...(request.knowledgeSlugs ?? []).map((term) => ({ term, mode: "SHOULD" as const })),
    ];

    const retrievalStarted = performance.now();
    const semantic = await this.semanticService.query({
      query: request.query,
      providerKey: request.providerKey,
      status: "ACTIVE",
      customizable: request.customizable,
      limit: retrievalLimit,
      constraints,
    });

    const retrievalMs = performance.now() - retrievalStarted;
    const productIds = semantic.recommendations.map((item) => item.id);
    const records = await this.repository.findByIds(productIds);
    const memorySignals = await this.memory?.productSignals?.(productIds, profileKey) ?? new Map();
    const recordById = new Map(records.map((item) => [item.id, item]));
    const semanticById = new Map(semantic.recommendations.map((item) => [item.id, item]));
    const context: RecommendationContext = {
      query: request.query,
      budget: request.budget,
      quantity: Math.max(1, request.quantity ?? 1),
      currency: (request.currency ?? "EUR").toUpperCase(),
      customizable: request.customizable,
      sustainability: request.sustainability,
      sector: request.sector, campaign: request.campaign, audience: request.audience, profile: profileKey, pipeline: pipelineKey,
      profileTerms: profile.terms, weights: profile.weights, sustainableTerms: config.rules.sustainableTerms, premiumTerms: config.rules.premiumTerms, campaignTerms: config.rules.campaignTerms,
    };

    const candidates = semantic.recommendations.flatMap((semanticItem) => {
      const record = recordById.get(semanticItem.id);
      return record ? [toCandidate(record, semanticItem, context, memorySignals.get(record.id))] : [];
    });

    const scoringStarted = performance.now();
    const activeEngine = new RecommendationEngine(createCoreRecommendationRules().filter((rule) => pipeline.rules.includes(rule.id)));
    const evaluations = activeEngine.rank(candidates, context, candidates.length || limit)
      .filter((evaluation) => request.budget === undefined || (evaluation.candidate.unitPrice !== null && evaluation.candidate.unitPrice <= request.budget))
      .slice(0, limit);

    const items: RecommendationItemResult[] = evaluations.map((evaluation) => {
      const record = recordById.get(evaluation.candidate.productId)!;
      const semanticItem = semanticById.get(evaluation.candidate.productId)!;
      return {
        productId: record.id,
        providerKey: record.providerKey,
        externalId: record.externalId,
        sku: record.sku,
        name: record.name,
        slug: productSlug(record),
        description: record.shortDescription ?? record.description,
        score: evaluation.score + Math.round(semanticItem.score),
        unitPrice: evaluation.candidate.unitPrice,
        currency: context.currency,
        categories: record.categories,
        knowledge: semanticItem.matchedEntities.map((entity) => entity.name),
        customizable: record.customizable,
        reasons: [...semanticItem.reasons, ...evaluation.reasons],
        warnings: evaluation.warnings,
        matchedEntities: semanticItem.matchedEntities,
        explanation: { headline: `${evaluation.score + Math.round(semanticItem.score)} puntos de adecuación`, strengths: [...semanticItem.reasons, ...evaluation.reasons].slice(0,5), cautions: evaluation.warnings.slice(0,3) },
        ...(request.debug ? { factors: evaluation.factors, semanticScore: semanticItem.score } : {}),
      };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "es"));

    const scoringMs = performance.now() - scoringStarted;
    const response: RecommendationResponse = {
      query: request.query,
      profile: profileKey,
      pipeline: pipelineKey,
      totalCandidates: semantic.diagnostics.candidatesEvaluated,
      elapsedMs: Math.round((performance.now() - startedAt) * 100) / 100,
      metrics: { retrievalMs: Math.round(retrievalMs*100)/100, scoringMs: Math.round(scoringMs*100)/100, candidatesRetrieved: semantic.recommendations.length, candidatesScored: candidates.length, rulesEvaluated: candidates.length * pipeline.rules.length, discardedByBudget: Math.max(0, candidates.length - evaluations.length) },
      interpreted: semantic.interpreted,
      diagnostics: semantic.diagnostics,
      items,
    };

    if (this.memory) {
      const runId = await this.memory.recordRecommendation(request, response);
      (response as { runId?: string }).runId = runId;
    }

    await this.eventPublisher?.publish(recommendationCompletedEvent({
      query: request.query,
      totalCandidates: response.totalCandidates,
      returnedItems: response.items.length,
      elapsedMs: response.elapsedMs,
    }));
    return response;
  }
}

function toCandidate(record: RecommendationProductRecord, semantic: SemanticRecommendation, context: RecommendationContext, memorySignal?: { score: number; evidence: string[] }): RecommendationCandidate {
  const knowledge = semantic.matchedEntities.map((entity) => entity.name);
  return {
    productId: record.id,
    name: record.name,
    searchableText: [record.name, record.description, record.shortDescription, record.material, ...record.categories, ...record.tags, ...knowledge].filter(Boolean).join(" "),
    unitPrice: extractPrice(record, context.quantity, context.currency),
    customizable: record.customizable,
    popularityScore: numberFrom(record.metadata.popularityScore) ?? numberFrom(record.attributes.popularityScore) ?? 0,
    categories: record.categories,
    knowledge,
    memoryScore: memorySignal?.score ?? 0,
    memoryEvidence: memorySignal?.evidence ?? [],
  };
}

function extractPrice(record: RecommendationProductRecord, quantity: number, currency: string): number | null {
  const roots = [record.metadata, record.attributes];
  for (const root of roots) {
    for (const key of ["unitPrice", "price", "salePrice", "retailPrice", "precio", "precioVenta"]) {
      const value = numberFrom(root[key]);
      if (value !== null) return value;
    }
    const prices = root.prices;
    if (Array.isArray(prices)) {
      const valid = prices
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
        .filter((item) => !item.currency || String(item.currency).toUpperCase() === currency)
        .filter((item) => (numberFrom(item.minQuantity) ?? 1) <= quantity && (numberFrom(item.maxQuantity) ?? Number.MAX_SAFE_INTEGER) >= quantity)
        .map((item) => numberFrom(item.amount ?? item.price ?? item.unitPrice))
        .filter((value): value is number => value !== null);
      if (valid.length) return Math.min(...valid);
    }
  }
  return null;
}

function numberFrom(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}


function productSlug(record: RecommendationProductRecord): string {
  const configured = record.metadata.slug ?? record.attributes.slug;
  if (typeof configured === "string" && configured.trim()) return configured.trim();
  return slugify(record.name || record.externalId || record.id);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "producto";
}
