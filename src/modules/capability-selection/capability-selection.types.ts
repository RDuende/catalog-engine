import type { CapabilityExecutionPath, NextAction } from "../../platform/runtime/contracts/index.js";

export interface CapabilityProviderDefinition {
  readonly capabilityId: string;
  readonly providerId: string;
  readonly version: string;
  readonly actions: readonly NextAction[];
  readonly executionPath: CapabilityExecutionPath;
  readonly priority: number;
  readonly enabled: boolean;
  readonly expectedLatencyMs: number;
  readonly executionBudgetMs: number;
  readonly acknowledgementBudgetMs: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
