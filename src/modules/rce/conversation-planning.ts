import type { RceConversationState } from "./contracts.js";
import { RceGoalEngine } from "./goal-engine.js";
import { planNextQuestion } from "./question-planner.js";

const engine = new RceGoalEngine();

export function planConversation(state: RceConversationState, now = new Date().toISOString()) {
  const goals = engine.plan(state, now);
  return Object.freeze({ goals, question: planNextQuestion(goals) });
}
