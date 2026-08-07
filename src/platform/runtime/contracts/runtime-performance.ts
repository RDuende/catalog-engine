import type { CapabilitySelection } from "./capability-selection.js";

export type RuntimeActivityMode = "NONE" | "SUBTLE" | "PROGRESS";
export type RuntimeLatencyClass = "FAST" | "NORMAL" | "ADVANCED";

export interface RuntimePerformanceAssessment {
  readonly selection: CapabilitySelection;
  readonly latencyClass: RuntimeLatencyClass;
  readonly expectedLatencyMs: number;
  readonly executionBudgetMs: number;
  readonly acknowledgementBudgetMs: number;
  readonly requiresAsyncExecution: boolean;
  readonly activityMode: RuntimeActivityMode;
  readonly reasons: readonly string[];
}

export interface RuntimePerformanceReport {
  readonly assessment: RuntimePerformanceAssessment;
  readonly actualRuntimeMs: number;
  readonly runtimeWithinAcknowledgementBudget: boolean;
  readonly runtimeWithinExecutionBudget: boolean;
  readonly slaStatus: "WITHIN_BUDGET" | "ACKNOWLEDGEMENT_BREACH" | "EXECUTION_BREACH";
  readonly measuredAt: string;
}
