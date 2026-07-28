import type { CatalogKnowledgeData } from "../catalog-knowledge/knowledge-types.js";
import type { GraphEdge, GraphNode, ProductKnowledgeGraphData } from "./graph-types.js";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildProductKnowledgeGraph(knowledge: CatalogKnowledgeData): ProductKnowledgeGraphData {
  const nodes: Record<string, GraphNode> = {};
  const outgoing: Record<string, GraphEdge[]> = {};
  const incoming: Record<string, GraphEdge[]> = {};

  const addNode = (node: GraphNode) => { nodes[node.id] ??= node; };
  const addEdge = (edge: GraphEdge) => {
    const out = outgoing[edge.from] ?? [];
    if (!out.some((item) => item.to === edge.to && item.type === edge.type)) out.push(edge);
    outgoing[edge.from] = out;
    const inc = incoming[edge.to] ?? [];
    if (!inc.some((item) => item.from === edge.from && item.type === edge.type)) inc.push(edge);
    incoming[edge.to] = inc;
  };

  const providerId = `provider:${slug(knowledge.provider)}`;
  addNode({ id: providerId, type: "PROVIDER", label: knowledge.provider });

  for (const [familyId, family] of Object.entries(knowledge.families)) {
    addNode({ id: `family:${familyId}`, type: "FAMILY", label: family.name, metadata: { pages: family.pages } });
  }

  for (const node of Object.values(knowledge.references)) {
    const productId = `product:${node.reference}`;
    addNode({
      id: productId,
      type: "PRODUCT",
      label: node.reference,
      metadata: { reference: node.reference, pages: node.pages, variants: node.variants },
    });
    addEdge({ from: productId, to: providerId, type: "SUPPLIED_BY", weight: 1 });

    for (const category of node.categories) {
      const id = `category:${slug(category)}`;
      addNode({ id, type: "CATEGORY", label: category });
      addEdge({ from: productId, to: id, type: "IN_CATEGORY", weight: 3 });
    }
    for (const material of node.materials) {
      const id = `material:${slug(material)}`;
      addNode({ id, type: "MATERIAL", label: material });
      addEdge({ from: productId, to: id, type: "MADE_OF", weight: 4 });
    }
    for (const term of node.terms) {
      const id = `term:${slug(term)}`;
      addNode({ id, type: "TERM", label: term });
      addEdge({ from: productId, to: id, type: "HAS_TERM", weight: 1 });
    }
  }

  for (const [familyId, family] of Object.entries(knowledge.families)) {
    for (const reference of family.references) {
      addEdge({ from: `product:${reference}`, to: `family:${familyId}`, type: "BELONGS_TO_FAMILY", weight: 5 });
    }
  }

  const products = Object.values(nodes).filter((node) => node.type === "PRODUCT");
  for (let i = 0; i < products.length; i += 1) {
    for (let j = i + 1; j < products.length; j += 1) {
      const a = products[i]!;
      const b = products[j]!;
      const aTargets = new Set((outgoing[a.id] ?? []).filter((e) => e.type !== "HAS_TERM" && e.type !== "SUPPLIED_BY").map((e) => e.to));
      const shared = (outgoing[b.id] ?? []).filter((e) => aTargets.has(e.to));
      if (shared.length > 0) {
        const weight = shared.reduce((sum, edge) => sum + edge.weight, 0);
        addEdge({ from: a.id, to: b.id, type: "RELATED_TO", weight });
        addEdge({ from: b.id, to: a.id, type: "RELATED_TO", weight });
      }
    }
  }

  return { version: "0.32.0", createdAt: new Date().toISOString(), nodes, outgoing, incoming };
}
