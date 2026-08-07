import type { CandidateScore, ProposalBrainCandidate, ProposalBrainInput } from "./proposal-brain.types.js";
function intersects(left:readonly string[]|undefined,right:readonly string[]|undefined):readonly string[]{if(!left?.length||!right?.length)return[];const set=new Set(right);return Object.freeze(left.filter(v=>set.has(v)))}
export function scoreCandidate(candidate:ProposalBrainCandidate,input:ProposalBrainInput):CandidateScore{
 const reasons:string[]=[];const warnings:string[]=[];const matches=intersects(candidate.canonicalInterests,input.interests);
 const relevanceScore=Math.min(1,(candidate.score??0.4)+matches.length*0.18);if(matches.length)reasons.push(`Coincidencia directa con ${matches.join(", ")}.`);
 let budgetScore=.7;if(input.budget!==undefined&&candidate.price!==undefined){if(candidate.price<=input.budget){budgetScore=1;reasons.push("Compatible con el presupuesto.")}else{budgetScore=.2;warnings.push("Supera el presupuesto individual.")}}
 const personalizationScore=candidate.personalizationAvailable?1:.55;if(candidate.personalizationAvailable)reasons.push("Admite personalización.");
 const stockScore=candidate.stock===undefined?.75:candidate.stock>0?1:.1;if(candidate.stock===0)warnings.push("Sin stock.");
 const commercialScore=candidate.marginPercent===undefined?.65:Math.max(0,Math.min(1,candidate.marginPercent/60));
 const totalScore=relevanceScore*.4+budgetScore*.2+personalizationScore*.15+stockScore*.15+commercialScore*.1;
 return Object.freeze({candidate,relevanceScore,budgetScore,personalizationScore,stockScore,commercialScore,totalScore,reasons:Object.freeze(reasons),warnings:Object.freeze(warnings)});
}
export function rankCandidates(input:ProposalBrainInput):readonly CandidateScore[]{return Object.freeze(input.candidates.map(c=>scoreCandidate(c,input)).sort((a,b)=>b.totalScore-a.totalScore))}
