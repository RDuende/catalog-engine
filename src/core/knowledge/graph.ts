import type { AttributeType, KnowledgeEntity, KnowledgeGraphSnapshot, KnowledgeRelation, ProductEntity, ProductQuery } from "./model.js";
import { normalizeKey } from "./registry.js";

export class KnowledgeGraph {
  private readonly entityMap: Map<string, KnowledgeEntity>;
  private readonly outgoing = new Map<string, KnowledgeRelation[]>();

  constructor(public readonly snapshot: KnowledgeGraphSnapshot) {
    this.entityMap = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
    for (const relation of snapshot.relations) {
      const list = this.outgoing.get(relation.from) ?? [];
      list.push(relation);
      this.outgoing.set(relation.from, list);
    }
  }

  products(query: ProductQuery = {}): ProductEntity[] {
    return this.snapshot.entities.filter((entity): entity is ProductEntity => entity.type === "product").filter((product) => {
      if (query.validOnly && !product.valid) return false;
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
