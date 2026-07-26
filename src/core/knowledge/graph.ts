import type {
  AttributeType,
  GraphPath,
  GraphTraversalOptions,
  KnowledgeEntity,
  KnowledgeGraphSnapshot,
  KnowledgeRelation,
  ProductEntity,
  ProductQuery,
} from "./model.js";
import { normalizeKey } from "./registry.js";

export class KnowledgeGraph {
  private readonly entityMap: Map<string, KnowledgeEntity>;
  private readonly outgoing = new Map<string, KnowledgeRelation[]>();
  private readonly incoming = new Map<string, KnowledgeRelation[]>();

  constructor(public readonly snapshot: KnowledgeGraphSnapshot) {
    this.entityMap = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
    for (const relation of snapshot.relations) {
      push(this.outgoing, relation.from, relation);
      push(this.incoming, relation.to, relation);
      if (relation.bidirectional) {
        const reverse = { ...relation, id: `${relation.id}:reverse`, from: relation.to, to: relation.from };
        push(this.outgoing, reverse.from, reverse);
        push(this.incoming, reverse.to, reverse);
      }
    }
  }

  products(query: ProductQuery = {}): ProductEntity[] {
    return this.snapshot.entities.filter((entity): entity is ProductEntity => entity.type === "product").filter((product) => {
      if (query.validOnly && !product.valid) return false;
      if (query.minConfidence !== undefined && product.confidence < query.minConfidence) return false;
      if (query.maxPriceMinor !== undefined && (product.priceMinor === undefined || product.priceMinor > query.maxPriceMinor)) return false;
      if (query.category && !this.hasTarget(product.id, "category", normalizeKey(query.category))) return false;
      for (const [attributeType, value] of Object.entries(query.attributes ?? {}) as Array<[AttributeType, string]>) {
        if (!this.hasAttribute(product.id, attributeType, normalizeKey(value))) return false;
      }
      return true;
    });
  }

  entity(id: string): KnowledgeEntity | undefined {
    return this.entityMap.get(id);
  }

  relations(entityId: string, options: GraphTraversalOptions = {}): KnowledgeRelation[] {
    const direction = options.direction ?? "outgoing";
    const candidates = direction === "outgoing"
      ? this.outgoing.get(entityId) ?? []
      : direction === "incoming"
        ? this.incoming.get(entityId) ?? []
        : [...(this.outgoing.get(entityId) ?? []), ...(this.incoming.get(entityId) ?? [])];
    return candidates.filter((relation) => this.acceptRelation(relation, options));
  }

  paths(startId: string, options: GraphTraversalOptions = {}): GraphPath[] {
    const start = this.entityMap.get(startId);
    if (!start) return [];
    const maxDepth = Math.max(1, options.maxDepth ?? 3);
    const results: GraphPath[] = [];
    const walk = (currentId: string, steps: GraphPath["steps"], visited: Set<string>, score: number): void => {
      if (steps.length >= maxDepth) return;
      for (const relation of this.relations(currentId, options)) {
        const targetId = relation.from === currentId ? relation.to : relation.from;
        if (visited.has(targetId)) continue;
        const entity = this.entityMap.get(targetId);
        if (!entity) continue;
        const stepScore = clamp(relation.confidence) * clamp(relation.weight ?? 1) * clamp(entity.confidence);
        const nextScore = score * stepScore;
        const nextSteps = [...steps, { relation, entity, score: nextScore }];
        results.push({ start, steps: nextSteps, score: nextScore });
        walk(targetId, nextSteps, new Set([...visited, targetId]), nextScore);
      }
    };
    walk(startId, [], new Set([startId]), 1);
    return results.sort((a, b) => b.score - a.score);
  }

  explainPath(path: GraphPath): string[] {
    return path.steps.map((step, index) => {
      const previousStep = index > 0 ? path.steps.at(index - 1) : undefined;
      const previous = previousStep?.entity ?? path.start;
      return `${previous.label} --${step.relation.type}--> ${step.entity.label} (confianza ${step.relation.confidence.toFixed(2)}, peso ${(step.relation.weight ?? 1).toFixed(2)})`;
    });
  }

  private acceptRelation(relation: KnowledgeRelation, options: GraphTraversalOptions): boolean {
    if (options.minConfidence !== undefined && relation.confidence < options.minConfidence) return false;
    if (options.minWeight !== undefined && (relation.weight ?? 1) < options.minWeight) return false;
    if (options.relationTypes?.length && !options.relationTypes.includes(relation.type)) return false;
    return true;
  }

  private hasTarget(productId: string, targetType: KnowledgeEntity["type"], normalizedLabel: string): boolean {
    return (this.outgoing.get(productId) ?? []).some((relation) => {
      const target = this.entityMap.get(relation.to);
      return target?.type === targetType && target.normalizedLabel === normalizedLabel;
    });
  }

  private hasAttribute(productId: string, attributeType: AttributeType, normalizedLabel: string): boolean {
    return (this.outgoing.get(productId) ?? []).some((relation) => {
      const target = this.entityMap.get(relation.to);
      return target?.type === "attribute" && target.attributeType === attributeType && target.normalizedLabel === normalizedLabel;
    });
  }
}

function push(map: Map<string, KnowledgeRelation[]>, key: string, relation: KnowledgeRelation): void {
  const list = map.get(key) ?? [];
  list.push(relation);
  map.set(key, list);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
