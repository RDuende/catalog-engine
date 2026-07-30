import type { ImportStore } from "./import-store.js"; import type { ImportProduct, KnowledgeRule, KnowledgeScope } from "./import-types.js";
const norm=(v:unknown)=>String(v??"").trim().toLocaleLowerCase("es-ES");
const rid=(scope:string,scopeId:string|undefined,field:string,value:string)=>`rule_${scope}_${scopeId??"all"}_${field}_${value.replace(/[^a-z0-9]+/g,"-").slice(0,18)}`;
export class ImportKnowledgeEngine {
 constructor(private readonly store:ImportStore){}
 async recordCorrection(product:ImportProduct,field:string,sourceValue:unknown,canonicalValue:unknown,scope:KnowledgeScope="supplier"):Promise<KnowledgeRule>{
  const source=norm(sourceValue), scopeId=scope==="supplier"?product.supplierId:scope==="import"?product.importId:undefined;
  const id=rid(scope,scopeId,field,source), existing=await this.store.getRule(id), now=new Date().toISOString();
  const rule:KnowledgeRule=existing?{...existing,canonicalValue,state:"confirmed",confidence:1,updatedAt:now,evidenceProductIds:[...new Set([...existing.evidenceProductIds,product.id])]}:
   {id,scope,scopeId,field,sourceValue:source,canonicalValue,state:"confirmed",confidence:1,origin:"human_correction",applications:0,successes:0,failures:0,createdAt:now,updatedAt:now,evidenceProductIds:[product.id]};
  await this.store.saveRule(rule); return rule;
 }
 async observe(product:ImportProduct,field:string,sourceValue:unknown,canonicalValue:unknown):Promise<KnowledgeRule>{
  const source=norm(sourceValue), id=rid("supplier",product.supplierId,field,source), existing=await this.store.getRule(id), now=new Date().toISOString();
  const evidence=[...new Set([...(existing?.evidenceProductIds??[]),product.id])]; const confidence=Math.min(.95,.5+evidence.length*.05);
  const rule:KnowledgeRule=existing?{...existing,canonicalValue,evidenceProductIds:evidence,confidence,state:evidence.length>=5?"proposed":"observed",updatedAt:now}:
   {id,scope:"supplier",scopeId:product.supplierId,field,sourceValue:source,canonicalValue,state:"observed",confidence,origin:"observed_pattern",applications:0,successes:0,failures:0,createdAt:now,updatedAt:now,evidenceProductIds:evidence};
  if(existing?.state==="confirmed") return existing; await this.store.saveRule(rule); return rule;
 }
 async confirm(ruleId:string){const r=await this.store.getRule(ruleId);if(!r)throw new Error(`Knowledge rule not found: ${ruleId}`);r.state="confirmed";r.confidence=Math.max(r.confidence,.95);r.updatedAt=new Date().toISOString();await this.store.saveRule(r);return r;}
 async apply(supplierId:string,importId:string,record:Record<string,unknown>){
  const rules=(await this.store.listRules()).filter(r=>r.state==="confirmed"&&(r.scope==="global"||(r.scope==="supplier"&&r.scopeId===supplierId)||(r.scope==="import"&&r.scopeId===importId)));
  const output={...record}; const applied:KnowledgeRule[]=[];
  for(const r of rules){if(norm(output[r.field])===r.sourceValue){output[r.field]=r.canonicalValue;r.applications++;r.updatedAt=new Date().toISOString();await this.store.saveRule(r);applied.push(r);}}
  return {record:output,appliedRules:applied};
 }
}
