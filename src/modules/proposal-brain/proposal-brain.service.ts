import { createHash } from "node:crypto";
import { buildBudgetPlan } from "./budget-engine.js";
import { rankCandidates } from "./candidate-engine.js";
import { diverseSelection, diversityScore } from "./diversity-engine.js";
import type { ProposalBrainDraft, ProposalBrainInput, ProposalBrainResult, ProposalBrainTrace } from "./proposal-brain.types.js";

function priceOf(ids:readonly string[],input:ProposalBrainInput):number|undefined{
 const values=ids.map(id=>input.candidates.find(c=>c.id===id)?.price);
 if(values.some(v=>v===undefined))return undefined;
 return values.reduce<number>(
    (sum, v) => sum + (v ?? 0),
    0,
  );
}

export class ProposalBrainService {
 analyze(input:ProposalBrainInput):ProposalBrainResult{
  const traces:ProposalBrainTrace[]=[];
  traces.push({phase:"NORMALIZE",message:"Entrada normalizada.",data:{strategy:input.strategy,budget:input.budget,interests:input.interests}});
  const ranked=rankCandidates(input);
  traces.push({phase:"CANDIDATES",message:`${ranked.length} candidatos puntuados.`});
  const budgetPlan=buildBudgetPlan(input);
  traces.push({phase:"BUDGET",message:input.budget!==undefined?`Presupuesto distribuido sobre ${input.budget}.`:"Sin presupuesto definido.",data:budgetPlan});

  const target=Math.max(1,Math.min(6,input.targetItemCount??(/SINGLE/iu.test(input.strategy??"")?1:3)));
  const drafts:ProposalBrainDraft[]=[];
  const rotations=Math.min(8,Math.max(1,ranked.length));

  for(let offset=0;offset<rotations;offset+=1){
   const rotated=[...ranked.slice(offset),...ranked.slice(0,offset)];
   const selected=diverseSelection(rotated,target);
   if(!selected.length)continue;
   const ids=selected.map(i=>i.candidate.id);
   const estimatedPrice=priceOf(ids,input);
   const withinBudget=input.budget===undefined||estimatedPrice===undefined||estimatedPrice<=input.budget;
   const diversity=diversityScore(selected);
   const average=selected.reduce((sum,i)=>sum+i.totalScore,0)/selected.length;
   const confidence=Math.max(.45,Math.min(.98,(input.confidence??.7)*.65+diversity*.2+(input.interests?.length?.15:0)));
   const score=average*.72+diversity*.18+(withinBudget?.1:0);
   const id=createHash("sha1").update(ids.slice().sort().join("|")).digest("hex").slice(0,14);
   drafts.push(Object.freeze({
    id,title:input.strategy?`Propuesta ${input.strategy}`:"Propuesta equilibrada",strategy:input.strategy??"UNSPECIFIED",
    candidateIds:Object.freeze(ids),...(ids[0]?{primaryCandidateId:ids[0]}:{}),...(estimatedPrice!==undefined?{estimatedPrice}:{}),
    withinBudget,diversityScore:diversity,score,confidence,
    reasons:Object.freeze([`${selected.length} productos seleccionados.`,`Diversidad ${(diversity*100).toFixed(0)}%.`,withinBudget?"Compatible con presupuesto.":"Requiere ajuste de presupuesto."]),
    warnings:Object.freeze(withinBudget?[]:["La combinación supera el presupuesto."]),
   }));
  }

  const unique=new Map<string,ProposalBrainDraft>();
  for(const draft of drafts){const key=draft.candidateIds.slice().sort().join("|");const current=unique.get(key);if(!current||draft.score>current.score)unique.set(key,draft)}
  const finalDrafts=[...unique.values()].sort((a,b)=>b.score-a.score).slice(0,5);
  traces.push({phase:"DIVERSITY",message:"Se aplicó diversidad para evitar propuestas repetitivas."});
  traces.push({phase:"DRAFTS",message:`${finalDrafts.length} propuestas preliminares generadas.`});

  return Object.freeze({
   generatedAt:new Date().toISOString(),input,budgetPlan,rankedCandidates:ranked,drafts:Object.freeze(finalDrafts),
   diagnostics:Object.freeze({inputCandidates:input.candidates.length,rankedCandidates:ranked.length,generatedDrafts:finalDrafts.length}),
   traces:Object.freeze(traces),
  });
 }
}
export const defaultProposalBrain=new ProposalBrainService();
