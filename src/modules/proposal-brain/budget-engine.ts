import type { BudgetPlan, ProposalBrainInput } from "./proposal-brain.types.js";
export function buildBudgetPlan(input:ProposalBrainInput):BudgetPlan{
 const budget=input.budget;if(budget===undefined)return Object.freeze({});
 const premium=/PREMIUM|BUNDLE|HERO_PLUS/iu.test(input.strategy??"");const hero=premium?.55:.72;const comp=premium?.25:.15;const msg=.08;const pack=Math.max(0,1-hero-comp-msg);
 return Object.freeze({totalBudget:budget,heroBudget:budget*hero,complementsBudget:budget*comp,messageBudget:budget*msg,packagingBudget:budget*pack});
}
