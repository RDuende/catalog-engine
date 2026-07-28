export interface KnowledgeSourcePage {
  page: number;
  text: string;
}

export interface ReferenceNode {
  reference: string;
  provider: string;
  pages: number[];
  categories: string[];
  materials: string[];
  variants: string[];
  terms: string[];
}

export interface FamilyNode {
  id: string;
  name: string;
  references: string[];
  pages: number[];
}

export interface CatalogKnowledgeData {
  version: "0.31.0";
  provider: string;
  sourceFile: string;
  createdAt: string;
  references: Record<string, ReferenceNode>;
  families: Record<string, FamilyNode>;
  categories: Record<string, string[]>;
  materials: Record<string, string[]>;
  terms: Record<string, string[]>;
}

export interface KnowledgeSearchResult {
  reference: string;
  score: number;
  node: ReferenceNode;
}
