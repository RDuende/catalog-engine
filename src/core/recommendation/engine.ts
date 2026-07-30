import type { AttributeType, KnowledgeEntity, KnowledgeGraphSnapshot, KnowledgeRelation, ProductEntity } from "../knowledge/model.js";
import { normalizeKey } from "../knowledge/registry.js";
import { buildRecommendationReasons } from "./explain.js";
import { isEligibleCandidate } from "./filters.js";
import type { RecommendationCandidateContext, RecommendationCriteria, RecommendationResult, RecommendedProduct } from "./model.js";
import { normalizeText, scoreCandidate } from "./scorer.js";

export class RecommendationEngine {
  private readonly entities: Map<string, KnowledgeEntity>;
  private readonly outgoing: Map<string, KnowledgeRelation[]>;

  constructor(private readonly snapshot: KnowledgeGraphSnapshot) {
    this.entities = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
    this.outgoing = new Map();
    for (const relation of snapshot.relations) {
      const relations = this.outgoing.get(relation.from) ?? [];
      relations.push(relation);
      this.outgoing.set(relation.from, relations);
    }
  }

  recommend(criteria: RecommendationCriteria = {}): RecommendationResult {
    const products = this.snapshot.entities.filter((entity): entity is ProductEntity => entity.type === "product");
    const candidates = products.map((product) => this.contextFor(product));
    const eligible = candidates.filter((candidate) => isEligibleCandidate(candidate, criteria));
    const minimumScore = criteria.minimumScore ?? 0;
    const limit = Math.max(1, Math.min(100, criteria.limit ?? 10));

    const items = eligible
      .map((candidate): RecommendedProduct => {
        const scored = scoreCandidate(candidate, criteria);
        return {
          product: candidate.product,
          score: scored.breakdown.total,
          reasons: buildRecommendationReasons(scored.evidence),
          evidence: scored.evidence,
          breakdown: scored.breakdown,
          matchedCategories: scored.matchedCategories,
          matchedAttributes: scored.matchedAttributes,
        };
      })
      .filter((item) => item.score >= minimumScore)
      .sort((a, b) => b.score - a.score || b.product.confidence - a.product.confidence || a.product.label.localeCompare(b.product.label, "es"))
      .slice(0, limit);

    return {
      criteria,
      totalProducts: products.length,
      eligibleProducts: eligible.length,
      items,
    };
  }

  private contextFor(product: ProductEntity): RecommendationCandidateContext {
    const categories: string[] = [];
    const attributes: Partial<Record<AttributeType, string[]>> = {};
    const targetLabels: string[] = [];

    for (const relation of this.outgoing.get(product.id) ?? []) {
      const target = this.entities.get(relation.to);
      if (!target) continue;
      targetLabels.push(target.label);
      if (target.type === "category") categories.push(target.normalizedLabel);
      if (target.type === "attribute") {
        const values = attributes[target.attributeType] ?? [];
        values.push(target.normalizedLabel);
        attributes[target.attributeType] = values;
      }
    }

    const metadataText = metadataToText(product.metadata);
    const personalizationScore = readPersonalizationScore(product.metadata);
    return {
      product,
      categories: [...new Set(categories.map(normalizeKey))],
      attributes,
      searchableText: normalizeText([product.label, product.reference, ...targetLabels, metadataText].filter(Boolean).join(" ")),
      personalizationScore,
    };
  }
}

function readPersonalizationScore(metadata: Record<string, unknown>): number {
  const dna = isRecord(metadata.dna) ? metadata.dna : undefined;
  const personalization = dna && isRecord(dna.personalization) ? dna.personalization : undefined;
  const score = personalization?.score;
  return typeof score === "number" && Number.isFinite(score) ? score : 0;
}

function metadataToText(metadata: Record<string, unknown>): string {
  const selected = [metadata.description, metadata.tags, metadata.supplier, metadata.sku];
  return selected.flatMap((value) => Array.isArray(value) ? value : [value]).filter((value): value is string => typeof value === "string").join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
