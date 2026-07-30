import type { ImportProduct, ReprocessComparison } from "./import-types.js";
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function compareReprocessed(product:ImportProduct,proposed:Record<string,unknown>):ReprocessComparison{
 const original=product.classification??{};const keys=new Set([...Object.keys(original),...Object.keys(proposed)]);const changes:ReprocessComparison["changes"]=[], conflicts:ReprocessComparison["conflicts"]=[];
 for(const field of keys){const before=original[field],after=proposed[field];if(equal(before,after))continue;const wasHuman=(product.fieldDecisions.find(x=>x.field===field)?.source==="human_review");if(wasHuman)conflicts.push({field,current:before,proposed:after,reason:"La clasificación actual procede de una corrección humana"});else changes.push({field,before,after,reason:"El conocimiento actual propone un valor diferente"});}
 return {productId:product.id,original:structuredClone(original),proposed:structuredClone(proposed),changes,conflicts};
}
