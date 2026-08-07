import type { RceConversationPlan } from "./conversation-planner.contracts.js";
import { RceConversationPlanner } from "./conversation-planner.js";
import type { RceProcessResult } from "./contracts.js";

const planner = new RceConversationPlanner();

export interface RceOrchestratorDecision {
  readonly plan: RceConversationPlan;
  readonly needsInput: boolean;
  readonly readyForProposals: boolean;
  readonly shouldGenerateProposals: boolean;
  readonly nextQuestion?: string;
  readonly pendingFact?: string;
}

export function decideConversation(input: {
  readonly process: RceProcessResult;
  readonly message: string;
  readonly mode: "DISCOVER" | "GENERATE_PROPOSALS";
  readonly now?: string;
}): RceOrchestratorDecision {
  const plan = planner.plan({
    state: input.process.state,
    text: input.message,
    understanding: input.process.understanding,
    now: input.now,
  });

  const explicitGeneration =
    input.mode === "GENERATE_PROPOSALS" ||
    plan.intent === "GENERATE_PROPOSALS";

  const needsInput =
    plan.response.mode === "ASK" &&
    !explicitGeneration;

  return Object.freeze({
    plan,
    needsInput,
    readyForProposals: plan.goals.readyForProposals,
    shouldGenerateProposals: explicitGeneration,
    ...(plan.response.question
      ? { nextQuestion: plan.response.question }
      : {}),
    ...(plan.question.factKey
      ? { pendingFact: plan.question.factKey }
      : {}),
  });
}

export function serializeConversationPlan(
  plan: RceConversationPlan,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    version: "rce-0.5.0",
    intent: plan.intent,
    readiness: Object.freeze({
      readyForProposals: plan.goals.readyForProposals,
      score: plan.goals.score,
      missingRequired: plan.goals.missingRequired,
    }),
    nextQuestion: plan.response.question,
    response: plan.response,
    tasks: plan.tasks.map((task) =>
      Object.freeze({
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        reason: task.reason,
      }),
    ),
    generatedAt: plan.generatedAt,
  });
}
