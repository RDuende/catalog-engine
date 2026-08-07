import type { RceIntent } from "./conversation-planner.contracts.js";
import type { RceGoalPlan } from "./goal-contracts.js";

export interface RceProposalTrigger {
  readonly trigger: boolean;
  readonly explicit: boolean;
  readonly reason: string;
}

export function evaluateProposalTrigger(
  intent: RceIntent,
  goals: RceGoalPlan,
): RceProposalTrigger {
  if (intent === "GENERATE_PROPOSALS") {
    return Object.freeze({
      trigger: true,
      explicit: true,
      reason: "El usuario ha pedido propuestas explícitamente.",
    });
  }

  if (goals.readyForProposals) {
    return Object.freeze({
      trigger: false,
      explicit: false,
      reason: "Hay información suficiente; debe ofrecerse la acción sin ejecutar automáticamente.",
    });
  }

  return Object.freeze({
    trigger: false,
    explicit: false,
    reason: "Todavía falta información de alto valor.",
  });
}
