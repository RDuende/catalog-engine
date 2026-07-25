import { semanticNormalize } from "../knowledge/knowledge.utils.js";
import type {
  KnowledgeCandidate,
  KnowledgeRule,
  ProductKnowledgeSource
} from "./knowledge-builder.types.js";

function sourceText(product: ProductKnowledgeSource): string {
  const metadata =
    product.metadata && typeof product.metadata === "object"
      ? JSON.stringify(product.metadata)
      : "";

  return semanticNormalize([
    product.name,
    product.sku,
    product.shortDescription ?? "",
    product.description ?? "",
    ...product.categories.flatMap(({ category }) => [category.name, category.slug]),
    ...product.variants.flatMap((variant) => [variant.name ?? "", variant.colorName ?? ""]),
    metadata
  ].join(" "));
}

export function detectKnowledgeCandidates(
  product: ProductKnowledgeSource,
  rules: readonly KnowledgeRule[],
  minimumWeight = 0.5
): readonly KnowledgeCandidate[] {
  const text = sourceText(product);
  const candidates: KnowledgeCandidate[] = [];

  for (const rule of rules) {
    if (rule.weight < minimumWeight) continue;

    const matchedKeywords = rule.keywords.filter((keyword) =>
      text.includes(semanticNormalize(keyword))
    );

    if (!matchedKeywords.length) continue;

    const relationType =
      rule.nodeType === "TECHNIQUE" || rule.nodeType === "MATERIAL"
        ? "RELATED_TO"
        : rule.nodeType === "OBJECTIVE"
          ? "USED_FOR"
          : "SUITABLE_FOR";

    candidates.push({
      ruleId: rule.id,
      nodeType: rule.nodeType,
      nodeName: rule.nodeName,
      nodeSlug: rule.nodeSlug,
      relationType,
      weight: Math.min(1, rule.weight + Math.min(0.04, (matchedKeywords.length - 1) * 0.01)),
      confidence: rule.confidence ?? 0.9,
      explanation: rule.explanation,
      matchedKeywords
    });
  }

  for (const { category } of product.categories) {
    candidates.push({
      ruleId: `category.${category.id}`,
      nodeType: "CONCEPT",
      nodeName: category.name,
      nodeSlug: `categoria-${category.slug}`,
      relationType: "RELATED_TO",
      weight: 1,
      confidence: 1,
      explanation: `Categoría de catálogo: ${category.name}.`,
      matchedKeywords: [category.name]
    });
  }

  const unique = new Map<string, KnowledgeCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.nodeSlug}:${candidate.relationType}`;
    const previous = unique.get(key);
    if (!previous || candidate.weight > previous.weight) unique.set(key, candidate);
  }

  return [...unique.values()].sort((a, b) => b.weight - a.weight);
}
