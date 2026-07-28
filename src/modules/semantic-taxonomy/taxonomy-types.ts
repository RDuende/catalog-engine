export type TaxonomyRelationType = "inherits" | "related" | "supports" | "opposes";

export interface TaxonomyRelation {
  target: string;
  type: TaxonomyRelationType;
  weight?: number;
}

export interface TaxonomyConceptDefinition {
  id: string;
  label?: string;
  aliases?: string[];
  relations?: TaxonomyRelation[];
  metadata?: Record<string, unknown>;
}

export interface TaxonomyDefinition {
  version: string;
  concepts: TaxonomyConceptDefinition[];
}

export interface TaxonomyExpansionItem {
  concept: string;
  score: number;
  path: string[];
  relation?: TaxonomyRelationType;
}

export interface TaxonomyValidationIssue {
  level: "error" | "warning";
  message: string;
  concept?: string;
}
