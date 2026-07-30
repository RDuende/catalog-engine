export type ImportStatus =
  | "uploaded" | "analyzing" | "pending_review" | "partially_approved"
  | "completed" | "failed" | "cancelled";
export type ReviewMode = "strict" | "assisted" | "automatic";
export type ReviewDecision = "approved" | "corrected" | "rejected" | "deferred" | "duplicate";
export type KnowledgeScope = "global" | "supplier" | "import";
export type KnowledgeState = "observed" | "proposed" | "confirmed" | "rejected" | "disabled";
export type SnapshotStage = "source" | "normalized" | "classified" | "canonical" | "reviewed" | "reprocessed";

export interface ImportFileDescriptor { name:string; format:string; size?:number; checksum?:string; }
export interface ImportSession {
  id:string; supplierId:string; label:string; file:ImportFileDescriptor; status:ImportStatus;
  reviewMode:ReviewMode; createdAt:string; createdBy?:string; engineVersion:string; taxonomyVersion?:string;
  counts:{ total:number; approved:number; pending:number; corrected:number; rejected:number; errors:number; duplicates:number };
}
export interface FieldDecision { field:string; value:unknown; confidence:number; source:string; reasons:string[]; ruleIds?:string[]; }
export interface ImportProduct {
  id:string; importId:string; supplierId:string; sourceKey:string; status:"pending"|ReviewDecision;
  sourceRecord:Record<string,unknown>; normalizedRecord?:Record<string,unknown>;
  classification?:Record<string,unknown>; fieldDecisions:FieldDecision[]; createdAt:string; updatedAt:string;
}
export interface ImportSnapshot {
  id:string; importId:string; productId:string; stage:SnapshotStage; payload:Record<string,unknown>;
  engineVersion:string; taxonomyVersion?:string; createdAt:string; reason?:string;
}
export interface ImportReview {
  id:string; importId:string; productId:string; decision:ReviewDecision; reviewer?:string; createdAt:string;
  corrections?:Array<{field:string; oldValue:unknown; newValue:unknown; reason?:string}>; notes?:string;
}
export interface KnowledgeRule {
  id:string; scope:KnowledgeScope; scopeId?:string; field:string; sourceValue:string; canonicalValue:unknown;
  state:KnowledgeState; confidence:number; origin:"human_correction"|"observed_pattern"|"manual";
  applications:number; successes:number; failures:number; createdAt:string; updatedAt:string; evidenceProductIds:string[];
}
export interface ReprocessComparison {
  productId:string; original:Record<string,unknown>; proposed:Record<string,unknown>;
  changes:Array<{field:string; before:unknown; after:unknown; confidence?:number; reason?:string}>;
  conflicts:Array<{field:string; current:unknown; proposed:unknown; reason:string}>;
}
export interface ImportDashboardSummary { imports:number; products:number; pending:number; corrected:number; errors:number; confirmedRules:number; proposedRules:number; }
