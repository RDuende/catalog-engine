import type { GraphEdgeType, GraphNode, GraphSearchResult, ProductKnowledgeGraphData } from "./graph-types.js";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export class ProductKnowledgeGraph {
  constructor(readonly data: ProductKnowledgeGraphData) {}

  getNode(id: string): GraphNode | undefined { return this.data.nodes[id]; }

  getProduct(reference: string): GraphNode | undefined { return this.data.nodes[`product:${reference.trim()}`]; }

  neighbors(id: string, type?: GraphEdgeType): GraphNode[] {
    return (this.data.outgoing[id] ?? [])
      .filter((edge) => !type || edge.type === type)
      .map((edge) => this.data.nodes[edge.to])
      .filter((node): node is GraphNode => Boolean(node));
  }

  relatedProducts(reference: string, limit = 10): GraphSearchResult[] {
    const id = `product:${reference.trim()}`;
    return (this.data.outgoing[id] ?? [])
      .filter((edge) => edge.type === "RELATED_TO")
      .map((edge) => ({
        productId: edge.to,
        reference: String(this.data.nodes[edge.to]?.metadata?.reference ?? this.data.nodes[edge.to]?.label ?? ""),
        score: edge.weight,
        reasons: this.sharedReasons(id, edge.to),
      }))
      .sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference))
      .slice(0, limit);
  }

  searchProducts(query: string, limit = 20): GraphSearchResult[] {
    const terms = [...new Set(normalize(query).split(/[^a-z0-9]+/).filter((term) => term.length >= 2))];
    const results: GraphSearchResult[] = [];
    for (const node of Object.values(this.data.nodes)) {
      if (node.type !== "PRODUCT") continue;
      let score = 0;
      const reasons: string[] = [];
      for (const edge of this.data.outgoing[node.id] ?? []) {
        const target = this.data.nodes[edge.to];
        if (!target) continue;
        const label = normalize(target.label);
        for (const term of terms) {
          if (label === term || label.includes(term)) {
            score += edge.weight;
            reasons.push(`${target.type.toLowerCase()}: ${target.label}`);
          }
        }
      }
      const reference = String(node.metadata?.reference ?? node.label);
      if (terms.includes(normalize(reference))) { score += 10; reasons.push(`referencia: ${reference}`); }
      if (score > 0) results.push({ productId: node.id, reference, score, reasons: [...new Set(reasons)] });
    }
    return results.sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference)).slice(0, limit);
  }

  private sharedReasons(a: string, b: string): string[] {
    const aTargets = new Set((this.data.outgoing[a] ?? []).map((edge) => edge.to));
    return (this.data.outgoing[b] ?? [])
      .filter((edge) => aTargets.has(edge.to) && edge.type !== "SUPPLIED_BY" && edge.type !== "HAS_TERM")
      .map((edge) => this.data.nodes[edge.to]?.label)
      .filter((label): label is string => Boolean(label));
  }
}
