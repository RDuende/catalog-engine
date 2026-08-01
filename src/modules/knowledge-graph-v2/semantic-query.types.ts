import type { KnowledgeEntityType } from "./knowledge-graph.types.js";

export interface SemanticConstraint {
  term: string;
  type?: KnowledgeEntityType;
  mode: "MUST" | "SHOULD" | "EXCLUDE";
}

export interface SemanticQueryRequest {
  query: string;
  providerKey?: string;
  status?: string;
  customizable?: boolean;
  limit?: number;
  constraints?: SemanticConstraint[];
}

export interface ResolvedSemanticConstraint extends SemanticConstraint {
  normalizedTerm: string;
  entityIds: string[];
  entities: Array<{ id: string; type: KnowledgeEntityType; key: string; name: string }>;
}

export interface SemanticRecommendation {
  id: string;
  providerKey: string;
  externalId: string;
  sku: string | null;
  name: string;
  description: string | null;
  customizable: boolean;
  score: number;
  matchedMust: number;
  matchedShould: number;
  matchedEntities: Array<{
    id: string;
    type: KnowledgeEntityType;
    key: string;
    name: string;
    confidence: number;
    mode: "MUST" | "SHOULD";
  }>;
  reasons: string[];
}

export interface SemanticQueryResult {
  query: string;
  interpreted: {
    constraints: ResolvedSemanticConstraint[];
    providerKey?: string;
    status: string;
    customizable?: boolean;
  };
  recommendations: SemanticRecommendation[];
  diagnostics: {
    resolvedTerms: number;
    unresolvedTerms: string[];
    candidatesEvaluated: number;
    durationMs: number;
  };
}
