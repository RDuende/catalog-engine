import type {
  RceConversationPlan,
} from "./conversation-planner.contracts.js";
import type {
  RceConversationState,
  RceUnderstanding,
} from "./contracts.js";
import { RceGoalEngine } from "./goal-engine.js";
import { planIntent } from "./intent-planner.js";
import { evaluateProposalTrigger } from "./proposal-trigger.js";
import { planNextQuestion } from "./question-planner.js";
import { planResponse } from "./response-planner.js";
import { planTasks } from "./task-planner.js";

const goals = new RceGoalEngine();

export class RceConversationPlanner {
  plan(input: {
    readonly state: RceConversationState;
    readonly text: string;
    readonly understanding: RceUnderstanding;
    readonly now?: string;
  }): RceConversationPlan {
    const generatedAt = input.now ?? new Date().toISOString();
    const intent = planIntent(input.text, input.understanding);
    const goalPlan = goals.plan(input.state, generatedAt);
    const question = planNextQuestion(goalPlan);
    const tasks = planTasks({
      state: input.state,
      goals: goalPlan,
      intent,
    });
    const proposalTrigger = evaluateProposalTrigger(intent, goalPlan);
    const response = planResponse({
      state: input.state,
      intent,
      goals: goalPlan,
      question,
      proposalTrigger,
    });

    return Object.freeze({
      intent,
      understanding: input.understanding,
      goals: goalPlan,
      question,
      tasks,
      response,
      generatedAt,
    });
  }
}
