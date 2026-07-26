export type KnowledgeEntityType = "product" | "category" | "attribute";
export type AttributeType = "material" | "technique" | "dimension" | "occasion" | "audience" | "emotion" | "usage";
export type KnowledgeRelationType = "BELONGS_TO" | "HAS_ATTRIBUTE";

export interface KnowledgeEntityBase {
  id: string;
  type: KnowledgeEntityType;
  label: string;
  normalizedLabel: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface ProductEntity extends KnowledgeEntityBase {
  type: "product";
  reference?: string;
  priceMinor?: number;
  valid: boolean;
}

export interface CategoryEntity extends KnowledgeEntityBase {
  type: "category";
}

export interface AttributeEntity extends KnowledgeEntityBase {
  type: "attribute";
  attributeType: AttributeType;
  value: string;
}

export type KnowledgeEntity = ProductEntity | CategoryEntity | AttributeEntity;

export interface KnowledgeRelation {
  id: string;
  from: string;
  to: string;
  type: KnowledgeRelationType;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface KnowledgeGraphSnapshot {
  kind: "KnowledgeGraph";
  sourceFile: string;
  entities: KnowledgeEntity[];
  relations: KnowledgeRelation[];
  statistics: {
    products: number;
    categories: number;
    attributes: number;
    relations: number;
  };
}

export interface ProductQuery {
  category?: string;
  attributes?: Partial<Record<AttributeType, string>>;
  maxPriceMinor?: number;
  validOnly?: boolean;
}
