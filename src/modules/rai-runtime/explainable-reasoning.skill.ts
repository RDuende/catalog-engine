import { ExplainableReasoningEngine } from "../decision-engine/index.js";
import type { RuntimeSkill, RuntimeState } from "./runtime.types.js";

export class ExplainableReasoningSkill implements RuntimeSkill {
  readonly id = "explainable-reasoning";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly engine = new ExplainableReasoningEngine()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const reasoningTrace = this.engine.reason(state.raiContext);
    return {
      ...state,
      reasoningTrace,
      reasoningDecision: reasoningTrace.decision,
      data: {
        ...state.data,
        reasoningTrace,
      },
    };
  }
}
