import type { AttributeEntity, AttributeType, CategoryEntity, KnowledgeEntity, ProductEntity } from "./model.js";

export class EntityRegistry {
  private readonly entities = new Map<string, KnowledgeEntity>();

  product(input: Omit<ProductEntity, "id" | "type" | "normalizedLabel">): ProductEntity {
    const key = input.reference ? `product:ref:${normalizeKey(input.reference)}` : `product:id:${normalizeKey(input.label)}`;
    const existing = this.entities.get(key);
    if (existing?.type === "product") return existing;
    const entity: ProductEntity = { ...input, id: key, type: "product", normalizedLabel: normalizeKey(input.label) };
    this.entities.set(key, entity);
    return entity;
  }

  category(label: string, confidence = 1): CategoryEntity {
    const normalizedLabel = normalizeKey(label);
    const id = `category:${normalizedLabel}`;
    const existing = this.entities.get(id);
    if (existing?.type === "category") return existing;
    const entity: CategoryEntity = { id, type: "category", label: cleanLabel(label), normalizedLabel, confidence, metadata: {} };
    this.entities.set(id, entity);
    return entity;
  }

  attribute(attributeType: AttributeType, value: string, confidence = 1): AttributeEntity {
    const normalizedLabel = normalizeKey(value);
    const id = `attribute:${attributeType}:${normalizedLabel}`;
    const existing = this.entities.get(id);
    if (existing?.type === "attribute") return existing;
    const entity: AttributeEntity = {
      id,
      type: "attribute",
      attributeType,
      value: cleanLabel(value),
      label: cleanLabel(value),
      normalizedLabel,
      confidence,
      metadata: {},
    };
    this.entities.set(id, entity);
    return entity;
  }

  values(): KnowledgeEntity[] {
    return [...this.entities.values()];
  }
}

export function normalizeKey(value: string): string {
  return cleanLabel(value)
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
