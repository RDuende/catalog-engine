import type { EnrichedCatalog, EnrichedProduct } from "../enrichment/model.js";
import type { PipelineStage, StageContext } from "../pipeline/pipeline.js";
import type { AttributeType, KnowledgeGraphSnapshot, KnowledgeRelation, ProductEntity } from "./model.js";
import { EntityRegistry } from "./registry.js";

export class KnowledgeGraphBuilder implements PipelineStage<EnrichedCatalog, KnowledgeGraphSnapshot> {
  readonly name = "knowledge-graph-builder";

  execute(catalog: EnrichedCatalog, _context: StageContext): KnowledgeGraphSnapshot {
    const registry = new EntityRegistry();
    const relations = new Map<string, KnowledgeRelation>();

    for (const product of catalog.products) {
      const productEntity = registry.product(toProductEntity(product));
      for (const categoryValue of product.categories) {
        const category = registry.category(categoryValue.normalized, product.confidence);
        addRelation(relations, productEntity.id, category.id, "BELONGS_TO", product.confidence);
      }
      addAttributes(registry, relations, productEntity.id, "material", product.materials.map((item) => item.normalized), product.confidence);
      addAttributes(registry, relations, productEntity.id, "technique", product.techniques.map((item) => item.normalized), product.confidence);
      addAttributes(registry, relations, productEntity.id, "dimension", product.dimensions, product.confidence);
      addAttributes(registry, relations, productEntity.id, "occasion", product.ontology.occasions.map((item) => item.label), product.confidence);
      addAttributes(registry, relations, productEntity.id, "audience", product.ontology.audiences.map((item) => item.label), product.confidence);
      addAttributes(registry, relations, productEntity.id, "emotion", product.ontology.emotions.map((item) => item.label), product.confidence);
      addAttributes(registry, relations, productEntity.id, "usage", product.ontology.usages.map((item) => item.label), product.confidence);
    }

    const entities = registry.values();
    const relationValues = [...relations.values()];
    return {
      kind: "KnowledgeGraph",
      sourceFile: catalog.sourceFile,
      entities,
      relations: relationValues,
      statistics: {
        products: entities.filter((entity) => entity.type === "product").length,
        categories: entities.filter((entity) => entity.type === "category").length,
        attributes: entities.filter((entity) => entity.type === "attribute").length,
        relations: relationValues.length,
      },
    };
  }
}

function toProductEntity(product: EnrichedProduct): Omit<ProductEntity, "id" | "type" | "normalizedLabel"> {
  return {
    label: product.name || product.supplierSku || product.id,
    reference: product.supplierSku,
    priceMinor: product.prices[0]?.amountMinor,
    valid: product.valid,
    confidence: product.confidence,
    metadata: {
      canonicalId: product.id,
      sku: product.sku,
      supplier: product.supplier,
      description: product.description,
      prices: product.prices,
      source: product.source,
      warnings: product.warnings,
      tags: product.tags,
      ontology: product.ontology,
      dna: product.dna,
    },
  };
}

function addAttributes(
  registry: EntityRegistry,
  relations: Map<string, KnowledgeRelation>,
  productId: string,
  attributeType: AttributeType,
  values: string[],
  confidence: number,
): void {
  for (const value of values) {
    const attribute = registry.attribute(attributeType, value, confidence);
    addRelation(relations, productId, attribute.id, "HAS_ATTRIBUTE", confidence);
  }
}

function addRelation(
  relations: Map<string, KnowledgeRelation>,
  from: string,
  to: string,
  type: KnowledgeRelation["type"],
  confidence: number,
): void {
  const id = `${from}|${type}|${to}`;
  if (!relations.has(id)) relations.set(id, { id, from, to, type, confidence, metadata: {} });
}
