import type { RecommendationCandidate, RecommendationContext, RecommendationRule, RecommendationRuleResult } from "../engine/recommendation-core.types.js";
function normalize(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
const STOP_WORDS = new Set(["para","por","con","que","una","uno","los","las","del","necesito","quiero","busco"]);
function tokens(value: string): string[] { return [...new Set(normalize(value).split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP_WORDS.has(t)))]; }
function matchTerms(candidate: RecommendationCandidate, terms: readonly string[]): string[] { const text = normalize(candidate.searchableText); return terms.filter((term) => text.includes(normalize(term))); }

export class TextRelevanceRule implements RecommendationRule {
  readonly id="text-relevance"; applies(){return true;}
  evaluate(c: RecommendationCandidate, x: RecommendationContext): RecommendationRuleResult { const m=tokens(x.query).filter((t)=>normalize(c.searchableText).includes(t)); return {ruleId:this.id,category:"relevance",points:Math.min(40,m.length*8),matched:m.length>0,reason:m.length?`Coincide con: ${m.slice(0,5).join(", ")}.`:undefined}; }
}
export class BudgetRule implements RecommendationRule {
  readonly id="budget"; applies(x:RecommendationContext){return x.budget!==undefined;}
  evaluate(c:RecommendationCandidate,x:RecommendationContext):RecommendationRuleResult { const ok=c.unitPrice!==null&&c.unitPrice<=(x.budget??0); return {ruleId:this.id,category:"budget",points:ok?20:-40,matched:ok,reason:ok?"Está dentro del presupuesto indicado.":undefined,warning:ok?undefined:c.unitPrice===null?"No hay precio válido para el criterio solicitado.":"Supera el presupuesto indicado."}; }
}
export class CustomizableRule implements RecommendationRule {
  readonly id="customizable"; applies(x:RecommendationContext){return x.customizable!==undefined;}
  evaluate(c:RecommendationCandidate,x:RecommendationContext):RecommendationRuleResult { const ok=c.customizable===x.customizable; return {ruleId:this.id,category:"personalization",points:ok?10:-25,matched:ok,reason:ok&&c.customizable?"Admite personalización.":undefined,warning:ok?undefined:"No cumple el requisito de personalización."}; }
}
export class SustainabilityRule implements RecommendationRule {
  readonly id="sustainability"; applies(x:RecommendationContext){return x.sustainability===true || x.profile==="eco";}
  evaluate(c:RecommendationCandidate,x:RecommendationContext):RecommendationRuleResult { const m=matchTerms(c,x.sustainableTerms??[]); return {ruleId:this.id,category:"sustainability",points:m.length?30:-8,matched:m.length>0,reason:m.length?`Afinidad sostenible: ${m.slice(0,3).join(", ")}.`:undefined,warning:m.length?undefined:"No se ha detectado un atributo sostenible claro."}; }
}
export class SectorAffinityRule implements RecommendationRule {
  readonly id="sector-affinity"; applies(x:RecommendationContext){return Boolean(x.sector||x.profileTerms?.length);}
  evaluate(c:RecommendationCandidate,x:RecommendationContext):RecommendationRuleResult { const terms=[...(x.profileTerms??[]),...(x.sector?[x.sector]:[])]; const m=matchTerms(c,terms); return {ruleId:this.id,category:"sector",points:Math.min(25,m.length*8),matched:m.length>0,reason:m.length?`Adecuado para el sector/perfil: ${m.slice(0,3).join(", ")}.`:undefined}; }
}
export class CampaignAffinityRule implements RecommendationRule {
  readonly id="campaign-affinity"; applies(x:RecommendationContext){return Boolean(x.campaign);}
  evaluate(c:RecommendationCandidate,x:RecommendationContext):RecommendationRuleResult { const terms=x.campaignTerms?.[normalize(x.campaign??"")]??[x.campaign??""]; const m=matchTerms(c,terms); return {ruleId:this.id,category:"campaign",points:Math.min(24,m.length*8),matched:m.length>0,reason:m.length?`Encaja con la campaña ${x.campaign}.`:undefined}; }
}
export class PremiumAffinityRule implements RecommendationRule {
  readonly id="premium-affinity"; applies(x:RecommendationContext){return x.profile==="premium"||normalize(x.query).includes("premium")||normalize(x.query).includes("lujo");}
  evaluate(c:RecommendationCandidate,x:RecommendationContext):RecommendationRuleResult { const m=matchTerms(c,x.premiumTerms??[]); return {ruleId:this.id,category:"premium",points:m.length?25:-5,matched:m.length>0,reason:m.length?`Percepción premium por ${m.slice(0,3).join(", ")}.`:undefined}; }
}
export class PopularityRule implements RecommendationRule { readonly id="popularity"; applies(){return true;} evaluate(c:RecommendationCandidate):RecommendationRuleResult { const p=Math.min(10,Math.max(0,Math.round(c.popularityScore))); return {ruleId:this.id,category:"popularity",points:p,matched:p>0}; } }
export class CommercialMemoryRule implements RecommendationRule {
  readonly id="commercial-memory"; applies(){return true;}
  evaluate(c: RecommendationCandidate): RecommendationRuleResult {
    const p = Math.max(-25, Math.min(35, Math.round(c.memoryScore ?? 0)));
    const evidence = c.memoryEvidence ?? [];
    return { ruleId:this.id, category:"memory", points:p, matched:p!==0,
      reason:p>0 ? `La memoria comercial favorece este producto${evidence.length ? `: ${evidence.slice(0,2).join(", ")}` : "."}` : undefined,
      warning:p<0 ? `La memoria comercial penaliza este producto${evidence.length ? `: ${evidence.slice(0,2).join(", ")}` : "."}` : undefined };
  }
}
export function createCoreRecommendationRules(): readonly RecommendationRule[] { return [new TextRelevanceRule(),new BudgetRule(),new CustomizableRule(),new SustainabilityRule(),new SectorAffinityRule(),new CampaignAffinityRule(),new PremiumAffinityRule(),new PopularityRule(),new CommercialMemoryRule()]; }
