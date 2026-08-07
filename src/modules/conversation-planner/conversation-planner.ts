import { ConversationCatalog } from "./conversation-catalog.js";
import { DEFAULT_CONVERSATION_POLICIES } from "./conversation-policies.js";
import type { ConversationCandidate, ConversationPlan, ConversationPlannerInput, ConversationPolicy, NextConversationStep } from "./conversation-planner.types.js";

export class ConversationPlanner {
  constructor(
    private readonly policies: readonly ConversationPolicy[] = DEFAULT_CONVERSATION_POLICIES,
    private readonly catalog = new ConversationCatalog(),
  ) {}

  plan(input: ConversationPlannerInput, now?: string): ConversationPlan {
    const candidates = this.policies
      .map((policy) => policy.evaluate(input))
      .filter((candidate): candidate is ConversationCandidate => candidate !== null)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (right.priority !== left.priority) return right.priority - left.priority;
        return left.policyId.localeCompare(right.policyId);
      });

    const selectedCandidate = candidates[0];
    if (!selectedCandidate) throw new Error("No existe ningún movimiento conversacional aplicable.");

    const selected: NextConversationStep = Object.freeze({
      ...selectedCandidate,
      message: this.catalog.render(selectedCandidate.templateId, input.previousTemplateId),
      plannerVersion: "v1.4-conversation-planner-v1",
    });

    return Object.freeze({
      selected,
      candidates: Object.freeze(candidates),
      plannedAt: now ?? new Date().toISOString(),
    });
  }
}
