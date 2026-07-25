import type { DomainEvent } from "../../core/events/domain-events.js";

export type KnowledgeBuildScope = "product" | "catalog";

export interface KnowledgeRule {
  readonly id: string;
  readonly nodeType:
    | "CONCEPT"
    | "NEED"
    | "SOLUTION"
    | "SOLUTION_STEP"
    | "AUDIENCE"
    | "OCCASION"
    | "BUSINESS_TYPE"
    | "OBJECTIVE"
    | "STYLE"
    | "MATERIAL"
    | "TECHNIQUE";
  readonly nodeName: string;
  readonly nodeSlug: string;
  readonly keywords: readonly string[];
  readonly weight: number;
  readonly confidence?: number;
  readonly explanation: string;
}

export interface KnowledgeCandidate {
  readonly ruleId: string;
  readonly nodeType: KnowledgeRule["nodeType"];
  readonly nodeName: string;
  readonly nodeSlug: string;
  readonly relationType: "RELATED_TO" | "SUITABLE_FOR" | "USED_FOR";
  readonly weight: number;
  readonly confidence: number;
  readonly explanation: string;
  readonly matchedKeywords: readonly string[];
}

export interface ProductKnowledgeSource {
  readonly id: string;
  readonly name: string;
  readonly sku: string | null;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly customizable: boolean;
  readonly metadata: unknown;
  readonly categories: readonly {
    readonly category: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    };
  }[];
  readonly variants: readonly {
    readonly name: string | null;
    readonly sku: string;
    readonly metadata: unknown;
  }[];
}

export interface ProductKnowledgeBuildResult {
  readonly productId: string;
  readonly productName: string;
  readonly candidatesDetected: number;
  readonly nodesCreated: number;
  readonly nodesUpdated: number;
  readonly linksCreated: number;
  readonly linksUpdated: number;
  readonly candidates: readonly KnowledgeCandidate[];
}

export interface CatalogKnowledgeBuildResult {
  readonly productsProcessed: number;
  readonly productsFailed: number;
  readonly nodesCreated: number;
  readonly nodesUpdated: number;
  readonly linksCreated: number;
  readonly linksUpdated: number;
  readonly failures: readonly {
    readonly productId: string;
    readonly error: string;
  }[];
}

export interface KnowledgeBuildOptions {
  readonly dryRun?: boolean;
  readonly minimumWeight?: number;
}

export interface KnowledgeEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
