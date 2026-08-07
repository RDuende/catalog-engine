import type { CompletenessRequirementResult } from "../journey-completeness/index.js";
import type { ConversationCandidate, ConversationPlannerInput, ConversationPolicy } from "./conversation-planner.types.js";

const QUESTION_TEMPLATES: Readonly<Record<string, string>> = {
  "recipient.count": "question.recipient.count",
  "recipient.relationship": "question.recipient.relationship",
  "occasion.type": "question.occasion.type",
  "recipient.age": "question.recipient.age",
  "budget.max": "question.budget.max",
  "recipient.interests": "question.recipient.interests",
};

function questionCandidate(requirement: CompletenessRequirementResult): ConversationCandidate {
  const requiredBoost = requirement.level === "REQUIRED" ? 0.25 : 0;
  const expectedValue = Math.min(1, requirement.weight / 25 + requiredBoost);
  return Object.freeze({
    policyId: "missing-information",
    type: "QUESTION",
    score: Number((0.55 + expectedValue * 0.4).toFixed(3)),
    priority: requirement.level === "REQUIRED" ? 100 : 60,
    factKey: requirement.key,
    templateId: QUESTION_TEMPLATES[requirement.key] ?? "summary.discovery",
    expectedValue,
    reasons: Object.freeze([
      requirement.level === "REQUIRED" ? "Falta información obligatoria." : "Falta información recomendada.",
      `El dato ${requirement.key} aporta peso ${requirement.weight}.`,
    ]),
    payload: Object.freeze({ factKey: requirement.key, label: requirement.label }),
  });
}

export class MissingInformationPolicy implements ConversationPolicy {
  readonly id = "missing-information";
  readonly priority = 100;

  evaluate(input: ConversationPlannerInput): ConversationCandidate | null {
    const missing = input.completeness.requirements
      .filter((item) => !item.satisfied)
      .sort((left, right) => {
        if (left.level !== right.level) return left.level === "REQUIRED" ? -1 : 1;
        return right.weight - left.weight;
      })[0];
    return missing ? questionCandidate(missing) : null;
  }
}

export class InspirationPolicy implements ConversationPolicy {
  readonly id = "inspiration-ready";
  readonly priority = 80;

  evaluate(input: ConversationPlannerInput): ConversationCandidate | null {
    if (!input.completeness.readyForInspiration) return null;
    return Object.freeze({
      policyId: this.id,
      type: "INSPIRATION",
      score: 0.92,
      priority: this.priority,
      templateId: "inspiration.ready",
      expectedValue: 0.9,
      reasons: Object.freeze(["Los requisitos obligatorios están completos.", "La puntuación supera el umbral de inspiración."]),
      payload: Object.freeze({ score: input.completeness.score }),
    });
  }
}

export class SummaryPolicy implements ConversationPolicy {
  readonly id = "summary-progress";
  readonly priority = 30;

  evaluate(input: ConversationPlannerInput): ConversationCandidate | null {
    if (input.completeness.score < 40 || input.completeness.readyForInspiration) return null;
    return Object.freeze({
      policyId: this.id,
      type: "SUMMARY",
      score: 0.45,
      priority: this.priority,
      templateId: "summary.discovery",
      expectedValue: 0.35,
      reasons: Object.freeze(["El Journey tiene suficiente información para resumir el progreso." ]),
      payload: Object.freeze({ score: input.completeness.score }),
    });
  }
}

export const DEFAULT_CONVERSATION_POLICIES: readonly ConversationPolicy[] = Object.freeze([
  new MissingInformationPolicy(),
  new InspirationPolicy(),
  new SummaryPolicy(),
]);
