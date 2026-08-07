import { JourneyProject } from "../journey-domain/index.js";
import type { JourneyCompletenessReport } from "../journey-completeness/index.js";
import { ConversationPlanner } from "./conversation-planner.js";
import type { ConversationPlan } from "./conversation-planner.types.js";

export interface ApplyConversationPlanResult {
  readonly journey: JourneyProject;
  readonly plan: ConversationPlan;
}

export function applyConversationPlan(
  journey: JourneyProject,
  completeness: JourneyCompletenessReport,
  planner = new ConversationPlanner(),
  now?: string,
): ApplyConversationPlanResult {
  const plan = planner.plan({ journey: journey.snapshot(), completeness }, now);
  const updated = journey.setFact({
    key: "conversation.next_step",
    value: plan.selected,
    confidence: 1,
    source: "SYSTEM",
    now,
  });
  return Object.freeze({ journey: updated, plan });
}
