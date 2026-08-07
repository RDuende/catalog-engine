import type { ReasoningCandidate, ReasoningFacts } from "../../../platform/runtime/contracts/index.js";

export interface DecisionPolicy {
  readonly id: string;
  readonly priority: number;
  evaluate(facts: ReasoningFacts): ReasoningCandidate | null;
}
