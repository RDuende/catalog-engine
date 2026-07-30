import type { ImportProduct, ImportReview, ImportSession, ImportSnapshot, KnowledgeRule } from "./import-types.js";
export interface ImportStore {
  saveSession(v:ImportSession):Promise<void>; getSession(id:string):Promise<ImportSession|undefined>; listSessions():Promise<ImportSession[]>;
  saveProduct(v:ImportProduct):Promise<void>; getProduct(id:string):Promise<ImportProduct|undefined>; listProducts(importId:string):Promise<ImportProduct[]>;
  saveSnapshot(v:ImportSnapshot):Promise<void>; listSnapshots(productId:string):Promise<ImportSnapshot[]>;
  saveReview(v:ImportReview):Promise<void>; listReviews(productId:string):Promise<ImportReview[]>;
  saveRule(v:KnowledgeRule):Promise<void>; getRule(id:string):Promise<KnowledgeRule|undefined>; listRules():Promise<KnowledgeRule[]>;
}
export class MemoryImportStore implements ImportStore {
  private sessions=new Map<string,ImportSession>(); private products=new Map<string,ImportProduct>();
  private snapshots:ImportSnapshot[]=[]; private reviews:ImportReview[]=[]; private rules=new Map<string,KnowledgeRule>();
  async saveSession(v:ImportSession){this.sessions.set(v.id,structuredClone(v));}
  async getSession(id:string){const v=this.sessions.get(id);return v?structuredClone(v):undefined;}
  async listSessions(){return [...this.sessions.values()].map(v=>structuredClone(v)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  async saveProduct(v:ImportProduct){this.products.set(v.id,structuredClone(v));}
  async getProduct(id:string){const v=this.products.get(id);return v?structuredClone(v):undefined;}
  async listProducts(importId:string){return [...this.products.values()].filter(x=>x.importId===importId).map(v=>structuredClone(v));}
  async saveSnapshot(v:ImportSnapshot){this.snapshots.push(structuredClone(v));}
  async listSnapshots(productId:string){return this.snapshots.filter(x=>x.productId===productId).map(v=>structuredClone(v)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));}
  async saveReview(v:ImportReview){this.reviews.push(structuredClone(v));}
  async listReviews(productId:string){return this.reviews.filter(x=>x.productId===productId).map(v=>structuredClone(v));}
  async saveRule(v:KnowledgeRule){this.rules.set(v.id,structuredClone(v));}
  async getRule(id:string){const v=this.rules.get(id);return v?structuredClone(v):undefined;}
  async listRules(){return [...this.rules.values()].map(v=>structuredClone(v));}
}
