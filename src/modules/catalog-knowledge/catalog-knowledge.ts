import type { CatalogKnowledgeData, KnowledgeSearchResult, ReferenceNode } from "./knowledge-types.js";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export class CatalogKnowledge {
  constructor(readonly data: CatalogKnowledgeData) {}

  findReference(reference: string): ReferenceNode | undefined {
    return this.data.references[reference.trim()];
  }

  findCategory(category: string): ReferenceNode[] {
    return this.nodes(this.data.categories[normalize(category)] ?? []);
  }

  findMaterial(material: string): ReferenceNode[] {
    return this.nodes(this.data.materials[normalize(material)] ?? []);
  }

  findFamily(family: string) {
    const key = normalize(family).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return this.data.families[key];
  }

  search(query: string, limit = 20): KnowledgeSearchResult[] {
    const queryTerms = [...new Set(normalize(query).split(/[^a-z0-9]+/).filter((term) => term.length >= 2))];
    const scores = new Map<string, number>();

    for (const term of queryTerms) {
      if (this.data.references[term]) scores.set(term, (scores.get(term) ?? 0) + 10);
      for (const reference of this.data.terms[term] ?? []) scores.set(reference, (scores.get(reference) ?? 0) + 2);
      for (const reference of this.data.categories[term] ?? []) scores.set(reference, (scores.get(reference) ?? 0) + 3);
      for (const reference of this.data.materials[term] ?? []) scores.set(reference, (scores.get(reference) ?? 0) + 4);
    }

    return [...scores.entries()]
      .map(([reference, score]) => ({ reference, score, node: this.data.references[reference]! }))
      .sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference))
      .slice(0, limit);
  }

  private nodes(references: string[]): ReferenceNode[] {
    return references.map((reference) => this.data.references[reference]).filter((node): node is ReferenceNode => Boolean(node));
  }
}
