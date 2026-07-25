import type { PriceTierCandidate } from "../pattern-engine/index.js";
export type AstNodeType = "CATALOG"|"PAGE"|"PRODUCT"|"CATEGORY"|"TABLE"|"TEXT"|"HEADER"|"FOOTER"|"UNKNOWN";
export interface AstSource { blockId:string; page:number; confidence:number; signals:string[]; }
export interface ProductAstData { reference?:string; name?:string; description?:string; dimensions:string[]; materials:string[]; colors:string[]; markingCodes:string[]; prices:PriceTierCandidate[]; }
export interface AstNode<T=unknown> { id:string; type:AstNodeType; source?:AstSource; data:T; children:AstNode[]; }
export interface CatalogAst { version:"1.0"; root:AstNode<{ pages:number; products:number; }>; statistics:{ nodes:number; products:number; categories:number; pages:number; }; }
