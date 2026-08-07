import { SemanticQueryService } from "../knowledge-graph-v2/semantic-query.service.js";
import { PgSemanticQueryRepository } from "../knowledge-graph-v2/semantic-query.repository.js";
import type { SemanticConstraint, SemanticRecommendation } from "../knowledge-graph-v2/semantic-query.types.js";
import { recommendationCompletedEvent } from "./recommendation.events.js";
import { RecommendationEngine } from "./engine/recommendation-engine.js";
import type { RecommendationCandidate, RecommendationContext } from "./engine/recommendation-core.types.js";
import { createCoreRecommendationRules } from "./rules/core.rules.js";
import { loadRecommendationConfig } from "./recommendation.config.js";
import { PgRecommendationRepository, type RecommendationProductRecord, type RecommendationRepository } from "./recommendation.repository.js";
import type { RecommendationEventPublisher, RecommendationRequest, RecommendationResponse, RecommendationItemResult, RecommendationConstraintEvidence } from "./recommendation.types.js";
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
    const rankedEvaluations = activeEngine.rank(candidates, context, candidates.length || limit);
    const candidatesWithValidPrice = candidates.filter((candidate) => candidate.unitPrice !== null).length;
    const candidatesMissingPrice = candidates.length - candidatesWithValidPrice;
    const candidatesOverBudget = request.budget === undefined ? 0 : candidates.filter((candidate) => candidate.unitPrice !== null && candidate.unitPrice > request.budget!).length;
    const eligibleEvaluations = rankedEvaluations.filter((evaluation) => request.budget === undefined || (evaluation.candidate.unitPrice !== null && evaluation.candidate.unitPrice <= request.budget));
    const evaluations = eligibleEvaluations.slice(0, limit);
    const discardedEvaluations = rankedEvaluations.filter((evaluation) => !eligibleEvaluations.includes(evaluation));

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
        explanation: buildExplanation(evaluation, semanticItem.score, semanticItem.reasons),
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
      metrics: { retrievalMs: Math.round(retrievalMs*100)/100, scoringMs: Math.round(scoringMs*100)/100, candidatesRetrieved: semantic.recommendations.length, candidatesScored: candidates.length, rulesEvaluated: candidates.length * pipeline.rules.length, discardedByBudget: discardedEvaluations.length, candidatesWithValidPrice, candidatesMissingPrice, candidatesOverBudget },
      interpreted: semantic.interpreted,
      diagnostics: semantic.diagnostics,
      items,
      analysis: {
        returned: items.length,
        discarded: Math.max(0, rankedEvaluations.length - evaluations.length),
        discardedAlternatives: discardedEvaluations.slice(0, 5).map((evaluation) => ({
          productId: evaluation.candidate.productId,
          name: evaluation.candidate.name,
          score: evaluation.score,
          reasons: evaluation.warnings.length ? evaluation.warnings.slice(0, 3) : ["No alcanzó los criterios finales de selección."],
        })),
      },
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
  const candidates: number[] = [];
  const visited = new Set<unknown>();
  for (const root of [record.metadata, record.attributes]) collectPriceCandidates(root, quantity, currency, candidates, visited, 0);
  return candidates.length ? Math.min(...candidates) : null;
}

function collectPriceCandidates(value: unknown, quantity: number, currency: string, out: number[], visited: Set<unknown>, depth: number): void {
  if (depth > 7 || value === null || value === undefined) return;
  if (typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);
  if (Array.isArray(value)) {
    for (const item of value) collectPriceCandidates(item, quantity, currency, out, visited, depth + 1);
    return;
  }
  const object = value as Record<string, unknown>;
  const objectCurrency = typeof object.currency === "string" ? object.currency.toUpperCase() : undefined;
  if (!objectCurrency || objectCurrency === currency) {
    const min = numberFrom(object.minQuantity ?? object.minQty ?? object.from ?? object.quantityFrom ?? object.qtyFrom) ?? 1;
    const max = numberFrom(object.maxQuantity ?? object.maxQty ?? object.to ?? object.quantityTo ?? object.qtyTo) ?? Number.MAX_SAFE_INTEGER;
    if (quantity >= min && quantity <= max) {
      for (const [key, raw] of Object.entries(object)) {
        if (/^(?:unit_?price|price|sale_?price|retail_?price|net_?price|base_?price|cost_?price|precio|precio_?venta|pvp|amount|value)$/i.test(key)) {
          const parsed = numberFrom(raw);
          if (parsed !== null && parsed > 0) out.push(parsed);
        }
      }
    }
  }
  for (const child of Object.values(object)) collectPriceCandidates(child, quantity, currency, out, visited, depth + 1);
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/[^0-9,.-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") && cleaned.includes(".")
    ? (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, ""))
    : cleaned.replace(",", ".");
  const parsed = Number(normalized);
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

function buildExplanation(evaluation: import("./engine/recommendation-core.types.js").RecommendationEvaluation, semanticScore: number, semanticReasons: readonly string[]) {
  const constraints: RecommendationConstraintEvidence[] = evaluation.factors.map((factor) => ({
    key: factor.ruleId,
    label: factor.category,
    status: factor.matched ? "MATCHED" : (factor.warning || factor.points < 0 ? "VIOLATED" : "NEUTRAL"),
    points: factor.points,
    reason: factor.reason,
    warning: factor.warning,
  }));
  const matchedConstraints = constraints.filter((item) => item.status === "MATCHED");
  const violatedConstraints = constraints.filter((item) => item.status === "VIOLATED");
  const positive = evaluation.factors.filter((factor) => factor.points > 0).reduce((sum, factor) => sum + factor.points, 0) + Math.max(0, semanticScore);
  const negative = Math.abs(evaluation.factors.filter((factor) => factor.points < 0).reduce((sum, factor) => sum + factor.points, 0));
  const confidence = Math.max(0, Math.min(1, Math.round((positive / Math.max(1, positive + negative + 20)) * 100) / 100));
  return {
    headline: `${evaluation.score + Math.round(semanticScore)} puntos de adecuación`,
    confidence,
    strengths: [...semanticReasons, ...evaluation.reasons].slice(0, 6),
    cautions: evaluation.warnings.slice(0, 4),
    matchedConstraints,
    violatedConstraints,
    rankingFactors: evaluation.factors.map((factor) => ({ ruleId: factor.ruleId, category: factor.category, points: factor.points, weight: factor.weight ?? 1, matched: factor.matched })),
  };
}
