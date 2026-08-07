import { CapabilitySelector } from "../capability-selection/index.js";
import type { RuntimeSkill, RuntimeState } from "./runtime.types.js";

export class CapabilitySelectionSkill implements RuntimeSkill {
  readonly id = "capability-selection";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly selector = new CapabilitySelector()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const decision = state.reasoningDecision;
    if (!decision) throw new Error("No existe reasoningDecision para seleccionar capability.");
    const capabilitySelection = this.selector.select(decision);
    return {
      ...state,
      capabilitySelection,
      data: { ...state.data, capabilitySelection },
    };
  }
}
