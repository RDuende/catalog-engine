export type KnowledgeEntityType = "product" | "category" | "attribute";
export type AttributeType = "material" | "technique" | "dimension" | "occasion" | "audience" | "emotion" | "usage";
export type KnowledgeRelationType = "BELONGS_TO" | "HAS_ATTRIBUTE" | "RELATED_TO" | "REQUIRES" | "ENABLES" | "SUITABLE_FOR";

export type KnowledgeSourceKind = "catalog" | "rule" | "import" | "manual" | "inference";

export interface KnowledgeProvenance {
  sourceKind: KnowledgeSourceKind;
  sourceId: string;
  observedAt: string;
  extractor?: string;
  version?: string;
  evidence?: string[];
}

export interface KnowledgeEntityBase {
  id: string;
  type: KnowledgeEntityType;
  label: string;
  normalizedLabel: string;
  confidence: number;
  metadata: Record<string, unknown>;
  provenance?: KnowledgeProvenance[];
  version?: number;
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
  weight?: number;
  bidirectional?: boolean;
  metadata: Record<string, unknown>;
  provenance?: KnowledgeProvenance[];
  version?: number;
}

export interface KnowledgeGraphSnapshot {
  kind: "KnowledgeGraph";
  schemaVersion?: "2.0";
  graphVersion?: number;
  generatedAt?: string;
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
  minConfidence?: number;
}

export interface GraphTraversalOptions {
  maxDepth?: number;
  minConfidence?: number;
  minWeight?: number;
  relationTypes?: KnowledgeRelationType[];
  direction?: "outgoing" | "incoming" | "both";
}

export interface GraphPathStep {
  relation: KnowledgeRelation;
  entity: KnowledgeEntity;
  score: number;
}

export interface GraphPath {
  start: KnowledgeEntity;
  steps: GraphPathStep[];
  score: number;
}
