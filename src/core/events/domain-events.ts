import type { EntityId } from "../shared/ids.js";

export interface DomainEvent<TName extends string = string, TPayload = unknown> {
  readonly id: string;
  readonly name: TName;
  readonly occurredAt: Date;
  readonly aggregateId?: EntityId;
  readonly payload: TPayload;
}

export type CatalogImported = DomainEvent<"catalog.imported", {
  catalogId: EntityId;
  catalogVersionId: EntityId;
  importJobId: EntityId;
  productsCreated: number;
  productsUpdated: number;
}>;

export type ProductCreated = DomainEvent<"product.created", { productId: EntityId; providerId: EntityId }>;
export type ProductUpdated = DomainEvent<"product.updated", { productId: EntityId; changedFields: readonly string[] }>;
export type KnowledgeGenerated = DomainEvent<"knowledge.generated", { productId?: EntityId; nodes: number; edges: number }>;
export type RecommendationGenerated = DomainEvent<"recommendation.generated", { recommendationId: EntityId; productId: EntityId; score: number }>;
export type ImportFinished = DomainEvent<"import.finished", { importJobId: EntityId; success: boolean; error?: string }>;

export type CatalogDomainEvent =
  | CatalogImported
  | ProductCreated
  | ProductUpdated
  | KnowledgeGenerated
  | RecommendationGenerated
  | ImportFinished;
