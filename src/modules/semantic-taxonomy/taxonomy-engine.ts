import { normalizeCanonicalText } from "../canonical-product/canonical-normalizer.js";
import type { TaxonomyConceptDefinition, TaxonomyDefinition, TaxonomyExpansionItem, TaxonomyRelationType } from "./taxonomy-types.js";
import { validateTaxonomy } from "./taxonomy-validator.js";

export class SemanticTaxonomyEngine {
  private readonly concepts = new Map<string, TaxonomyConceptDefinition>();
  private readonly aliases = new Map<string, string>();

  constructor(readonly definition: TaxonomyDefinition) {
    const errors = validateTaxonomy(definition).filter((issue) => issue.level === "error");
    if (errors.length) throw new Error(errors.map((issue) => issue.message).join("; "));
    for (const concept of definition.concepts) {
      const id = normalizeCanonicalText(concept.id);
      this.concepts.set(id, { ...concept, id });
      this.aliases.set(id, id);
      for (const alias of concept.aliases ?? []) this.aliases.set(normalizeCanonicalText(alias), id);
    }
  }

  resolve(value: string): string | undefined {
    return this.aliases.get(normalizeCanonicalText(value));
  }

  get(value: string): TaxonomyConceptDefinition | undefined {
    const id = this.resolve(value);
    return id ? this.concepts.get(id) : undefined;
  }

  search(query: string): TaxonomyConceptDefinition[] {
    const normalized = normalizeCanonicalText(query);
    return [...this.concepts.values()].filter((concept) =>
      [concept.id, concept.label ?? "", ...(concept.aliases ?? [])].some((value) => normalizeCanonicalText(value).includes(normalized)),
    );
  }

  expand(values: string[], options: { relations?: TaxonomyRelationType[]; maxDepth?: number; minimumScore?: number } = {}): TaxonomyExpansionItem[] {
    const allowed = new Set(options.relations ?? ["inherits", "related", "supports"]);
    const maxDepth = options.maxDepth ?? 4;
    const minimumScore = options.minimumScore ?? 0.25;
    const best = new Map<string, TaxonomyExpansionItem>();
    const queue: Array<{ concept: string; score: number; path: string[]; depth: number; relation?: TaxonomyRelationType }> = [];
    for (const value of values) {
      const concept = this.resolve(value) ?? normalizeCanonicalText(value);
      queue.push({ concept, score: 1, path: [concept], depth: 0 });
    }
    while (queue.length) {
      const current = queue.shift()!;
      const previous = best.get(current.concept);
      if (!previous || current.score > previous.score) best.set(current.concept, { concept: current.concept, score: current.score, path: current.path, relation: current.relation });
      if (current.depth >= maxDepth) continue;
      const definition = this.concepts.get(current.concept);
      for (const relation of definition?.relations ?? []) {
        if (!allowed.has(relation.type)) continue;
        const target = this.resolve(relation.target) ?? normalizeCanonicalText(relation.target);
        const score = current.score * (relation.weight ?? 0.8);
        if (score < minimumScore || score <= (best.get(target)?.score ?? 0)) continue;
        queue.push({ concept: target, score, path: [...current.path, target], depth: current.depth + 1, relation: relation.type });
      }
    }
    return [...best.values()].sort((a, b) => b.score - a.score || a.concept.localeCompare(b.concept));
  }
}
