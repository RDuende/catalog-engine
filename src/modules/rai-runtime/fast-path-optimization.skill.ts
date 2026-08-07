import { FastPathOptimizer } from "../runtime-performance/index.js";
import type { RuntimeSkill, RuntimeState } from "./runtime.types.js";

export class FastPathOptimizationSkill implements RuntimeSkill {
  readonly id = "fast-path-optimization";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly optimizer = new FastPathOptimizer()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    if (!state.capabilitySelection) {
      throw new Error("No existe capabilitySelection para optimizar la ruta de ejecución.");
    }
    const performanceAssessment = this.optimizer.assess(state.capabilitySelection);
    return {
      ...state,
      performanceAssessment,
      data: { ...state.data, performanceAssessment },
    };
  }
}
