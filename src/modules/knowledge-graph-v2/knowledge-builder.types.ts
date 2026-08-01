import type { KnowledgeEntityType, ProductKnowledgeRelation } from "./knowledge-graph.types.js";

export type KnowledgeSource = "PROVIDER" | "INFERRED" | "AI" | "MANUAL";

export interface CanonicalKnowledgeProduct {
  id: string;
  providerKey: string;
  externalId: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  brand?: string | null;
  material?: string | null;
  color?: string | null;
  dimensions?: string | null;
  weight?: number | null;
  customizable?: boolean;
  categories: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  variants: Array<{ material?: string | null; color?: string | null; size?: string | null; metadata?: Record<string, unknown> }>;
}

export interface DetectedKnowledge {
  type: KnowledgeEntityType;
  relationType: ProductKnowledgeRelation;
  key: string;
  name: string;
  aliases: string[];
  confidence: number;
  source: KnowledgeSource;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeBuildOptions {
  providerKey?: string;
  productIds?: string[];
  limit?: number;
  batchSize?: number;
  removeStaleAutoLinks?: boolean;
  onProgress?: (completed: number, total: number) => void | Promise<void>;
}

export interface KnowledgeBuildResult {
  runId?: string;
  received: number;
  processed: number;
  failed: number;
  entitiesCreated: number;
  entitiesReused: number;
  aliasesUpserted: number;
  linksCreated: number;
  linksUpdated: number;
  linksUnchanged: number;
  writesAvoided: number;
  staleLinksRemoved: number;
  detections: number;
  durationMs: number;
  productsPerSecond: number;
  errors: Array<{ productId: string; message: string }>;
}

export interface KnowledgeBuilderRepository {
  countProducts(options: KnowledgeBuildOptions): Promise<number>;
  listProducts(options: KnowledgeBuildOptions & { offset: number; limit: number }): Promise<CanonicalKnowledgeProduct[]>;
  upsertDetectedEntity(input: DetectedKnowledge, providerKey: string): Promise<{ id: string; created: boolean; aliasUpserted: boolean }>;
  upsertProductLink(input: {
    productId: string;
    entityId: string;
    relationType: ProductKnowledgeRelation;
    confidence: number;
    source: KnowledgeSource;
    metadata?: Record<string, unknown>;
  }): Promise<"CREATED" | "UPDATED" | "UNCHANGED">;
  removeStaleAutoLinks(productId: string, retainedEntityIds: string[]): Promise<number>;
  startBuild(options: KnowledgeBuildOptions): Promise<string | undefined>;
  finishBuild(runId: string | undefined, result: KnowledgeBuildResult, status: "COMPLETED" | "FAILED"): Promise<void>;
}
