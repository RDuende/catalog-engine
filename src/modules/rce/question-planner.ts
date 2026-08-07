import type { RceGoalPlan } from "./goal-contracts.js";

export interface RceQuestionPlan {
  readonly question?: string;
  readonly factKey?: string;
  readonly reason?: string;
  readonly readyForProposals: boolean;
  readonly goalScore: number;
}

export function planNextQuestion(goalPlan: RceGoalPlan): RceQuestionPlan {
  if (goalPlan.readyForProposals && !goalPlan.nextGoal?.required) {
    return Object.freeze({ readyForProposals: true, goalScore: goalPlan.score });
  }

  const next = goalPlan.nextGoal;
  if (!next) return Object.freeze({ readyForProposals: true, goalScore: goalPlan.score });

  return Object.freeze({
    question: next.question,
    factKey: next.factKey,
    reason: next.reason,
    readyForProposals: goalPlan.readyForProposals,
    goalScore: goalPlan.score,
  });
}
