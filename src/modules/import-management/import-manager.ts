import type { ImportStore } from "./import-store.js";import type { FieldDecision, ImportDashboardSummary, ImportProduct, ImportSession, ReviewMode } from "./import-types.js";import { ImportHistory } from "./import-history.js";import { ImportKnowledgeEngine } from "./knowledge-engine.js";import { compareReprocessed } from "./import-comparator.js";
const uid=(p:string)=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
export type Classifier=(record:Record<string,unknown>,context:{supplierId:string;importId:string})=>Promise<{classification:Record<string,unknown>;decisions?:FieldDecision[]}>;
export class ImportManager {
 readonly history:ImportHistory;readonly knowledge:ImportKnowledgeEngine;
 constructor(private store:ImportStore,private engineVersion:string,private taxonomyVersion?:string){this.history=new ImportHistory(store,engineVersion,taxonomyVersion);this.knowledge=new ImportKnowledgeEngine(store);}
 async createSession(input:{supplierId:string;label:string;file:{name:string;format:string;size?:number;checksum?:string};reviewMode:ReviewMode;createdBy?:string}){
  const s:ImportSession={id:uid("imp"),...input,status:"uploaded",engineVersion:this.engineVersion,taxonomyVersion:this.taxonomyVersion,createdAt:new Date().toISOString(),counts:{total:0,approved:0,pending:0,corrected:0,rejected:0,errors:0,duplicates:0}};await this.store.saveSession(s);return s;
 }
 async ingest(importId:string,records:Record<string,unknown>[],classifier:Classifier){
  const session=await this.store.getSession(importId);if(!session)throw new Error(`Import session not found: ${importId}`);session.status="analyzing";await this.store.saveSession(session);
  for(let i=0;i<records.length;i++){const record=records[i];if(!record)continue;const source:Record<string,unknown>=structuredClone(record);const productId=uid("ip");const applied=await this.knowledge.apply(session.supplierId,session.id,source);let result;
   try{result=await classifier(applied.record,{supplierId:session.supplierId,importId:session.id});}catch{session.counts.errors++;continue;}
   const autoApproved=session.reviewMode==="automatic";const p:ImportProduct={id:productId,importId:session.id,supplierId:session.supplierId,sourceKey:String(source.sku??source.reference??i),status:autoApproved?"approved":"pending",sourceRecord:source,normalizedRecord:applied.record,classification:result.classification,fieldDecisions:result.decisions??Object.entries(result.classification).map(([field,value])=>({field,value,confidence:.5,source:"classifier",reasons:[]})),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
   await this.store.saveProduct(p);await this.history.capture(session.id,p.id,"source",source);await this.history.capture(session.id,p.id,"normalized",applied.record,applied.appliedRules.length?`Applied rules: ${applied.appliedRules.map(r=>r.id).join(", ")}`:undefined);await this.history.capture(session.id,p.id,"classified",result.classification);
   session.counts.total++;autoApproved?session.counts.approved++:session.counts.pending++;
  }
  session.status=session.counts.pending?"pending_review":"completed";await this.store.saveSession(session);return session;
 }
 async reprocess(importId:string,classifier:Classifier){const s=await this.store.getSession(importId);if(!s)throw new Error(`Import session not found: ${importId}`);const out=[];for(const p of await this.store.listProducts(importId)){const applied=await this.knowledge.apply(s.supplierId,s.id,p.sourceRecord);const proposed=await classifier(applied.record,{supplierId:s.supplierId,importId:s.id});const c=compareReprocessed(p,proposed.classification);await this.history.capture(importId,p.id,"reprocessed",{proposed:proposed.classification,changes:c.changes,conflicts:c.conflicts},"Reprocesado en modo comparación; no modifica el producto");out.push(c);}return out;}
 async dashboard():Promise<ImportDashboardSummary>{const imports=await this.store.listSessions(),rules=await this.store.listRules();return {imports:imports.length,products:imports.reduce((n,x)=>n+x.counts.total,0),pending:imports.reduce((n,x)=>n+x.counts.pending,0),corrected:imports.reduce((n,x)=>n+x.counts.corrected,0),errors:imports.reduce((n,x)=>n+x.counts.errors,0),confirmedRules:rules.filter(x=>x.state==="confirmed").length,proposedRules:rules.filter(x=>x.state==="proposed").length};}
}
