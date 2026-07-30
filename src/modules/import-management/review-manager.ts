import type { ImportStore } from "./import-store.js"; import type { ImportProduct, ImportReview, ReviewDecision } from "./import-types.js"; import { ImportHistory } from "./import-history.js"; import { ImportKnowledgeEngine } from "./knowledge-engine.js";
const id=()=>`review_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
export class ReviewManager {
 constructor(private store:ImportStore,private history:ImportHistory,private knowledge:ImportKnowledgeEngine){}
 async review(productId:string,decision:ReviewDecision,options:{reviewer?:string;notes?:string;corrections?:Array<{field:string;oldValue:unknown;newValue:unknown;reason?:string}>}={}):Promise<ImportReview>{
  const product=await this.store.getProduct(productId);if(!product)throw new Error(`Import product not found: ${productId}`);
  const review:ImportReview={id:id(),importId:product.importId,productId,decision,reviewer:options.reviewer,notes:options.notes,corrections:options.corrections,createdAt:new Date().toISOString()};
  if(options.corrections?.length){product.classification={...(product.classification??{})};for(const c of options.corrections){product.classification[c.field]=c.newValue;await this.knowledge.recordCorrection(product,c.field,c.oldValue,c.newValue,"supplier");}}
  product.status=decision;product.updatedAt=review.createdAt;await this.store.saveProduct(product);await this.store.saveReview(review);
  await this.history.capture(product.importId,product.id,"reviewed",{decision,classification:product.classification??{},corrections:options.corrections??[]},options.notes);
  return review;
 }
 async queue(importId:string,mode:"all"|"incidents",threshold=.8){const products=await this.store.listProducts(importId);return products.filter(p=>p.status==="pending"&&(mode==="all"||p.fieldDecisions.some(d=>d.confidence<threshold)||!p.classification||p.fieldDecisions.length===0));}
}
