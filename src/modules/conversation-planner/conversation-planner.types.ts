import type { JourneyCompletenessReport } from "../journey-completeness/index.js";
import type { JourneyProjectSnapshot } from "../journey-domain/index.js";

export type ConversationStepType =
  | "QUESTION"
  | "CONFIRMATION"
  | "SUMMARY"
  | "INSPIRATION"
  | "PROPOSAL"
  | "IMAGE"
  | "COMPLETE";

export interface ConversationPlannerInput {
  readonly journey: JourneyProjectSnapshot;
  readonly completeness: JourneyCompletenessReport;
  readonly locale?: string;
  readonly previousTemplateId?: string;
}

export interface ConversationCandidate {
  readonly policyId: string;
  readonly type: ConversationStepType;
  readonly score: number;
  readonly priority: number;
  readonly factKey?: string;
  readonly templateId: string;
  readonly expectedValue: number;
  readonly reasons: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface NextConversationStep extends ConversationCandidate {
  readonly message: string;
  readonly plannerVersion: string;
}

export interface ConversationPlan {
  readonly selected: NextConversationStep;
  readonly candidates: readonly ConversationCandidate[];
  readonly plannedAt: string;
}

export interface ConversationPolicy {
  readonly id: string;
  readonly priority: number;
  evaluate(input: ConversationPlannerInput): ConversationCandidate | null;
}
