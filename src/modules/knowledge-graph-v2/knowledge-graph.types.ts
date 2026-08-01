export const KNOWLEDGE_ENTITY_TYPES = ["BRAND","CATEGORY","MATERIAL","TECHNIQUE","CERTIFICATE","ATTRIBUTE"] as const;
export type KnowledgeEntityType = typeof KNOWLEDGE_ENTITY_TYPES[number];
export const KNOWLEDGE_RELATION_TYPES = ["IS_A","RELATED_TO","COMPATIBLE_WITH","REQUIRES","CERTIFIED_BY","HAS_ATTRIBUTE"] as const;
export type KnowledgeRelationType = typeof KNOWLEDGE_RELATION_TYPES[number];
export type ProductKnowledgeRelation = "BRAND"|"CATEGORY"|"MATERIAL"|"TECHNIQUE"|"CERTIFICATE"|"ATTRIBUTE";
export interface KnowledgeEntity { id:string; type:KnowledgeEntityType; key:string; name:string; slug:string; description:string|null; metadata:Record<string,unknown>; createdAt:string; updatedAt:string; }
export interface CreateKnowledgeEntity { type:KnowledgeEntityType; key:string; name:string; slug?:string; description?:string; aliases?: string[]; metadata?:Record<string,unknown>; }
export interface KnowledgeStats { entities:number; relations:number; productLinks:number; aliases:number; byType:Partial<Record<KnowledgeEntityType,number>>; }
export interface KnowledgeGraphRepository {
  createEntity(input:CreateKnowledgeEntity):Promise<KnowledgeEntity>;
  listEntities(filters:{type?:KnowledgeEntityType;q?:string;limit:number;offset:number}):Promise<KnowledgeEntity[]>;
  getEntity(id:string):Promise<KnowledgeEntity|null>;
  createRelation(input:{sourceId:string;targetId:string;type:KnowledgeRelationType;weight?:number;confidence?:number;metadata?:Record<string,unknown>}):Promise<unknown>;
  getProductGraph(productId:string):Promise<unknown|null>;
  stats():Promise<KnowledgeStats>;
}
