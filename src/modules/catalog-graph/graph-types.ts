export type GraphNodeType = "PRODUCT" | "FAMILY" | "CATEGORY" | "MATERIAL" | "PROVIDER" | "TERM";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  metadata?: Record<string, unknown>;
}

export type GraphEdgeType =
  | "BELONGS_TO_FAMILY"
  | "IN_CATEGORY"
  | "MADE_OF"
  | "SUPPLIED_BY"
  | "HAS_TERM"
  | "RELATED_TO";

export interface GraphEdge {
  from: string;
  to: string;
  type: GraphEdgeType;
  weight: number;
}

export interface ProductKnowledgeGraphData {
  version: "0.32.0";
  createdAt: string;
  nodes: Record<string, GraphNode>;
  outgoing: Record<string, GraphEdge[]>;
  incoming: Record<string, GraphEdge[]>;
}

export interface GraphSearchResult {
  productId: string;
  reference: string;
  score: number;
  reasons: string[];
}
