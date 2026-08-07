import type { NextAction } from "./next-action.js";

export type CapabilityExecutionPath = "FAST_PATH" | "ADVANCED_PATH";

export interface CapabilitySelection {
  readonly action: NextAction;
  readonly capabilityId: string;
  readonly providerId: string;
  readonly executionPath: CapabilityExecutionPath;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
