import type { NextAction } from "./next-action.js";

export interface DecisionReason {
  readonly code: string;
  readonly message: string;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface Decision {
  readonly nextAction: NextAction;
  readonly confidence: number;
  readonly reasons: readonly DecisionReason[];
  readonly requiredCapabilities: readonly string[];
  readonly reply?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export function createDecision(input: Decision): Decision {
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new RangeError("Decision.confidence debe estar entre 0 y 1");
  }
  return Object.freeze({
    ...input,
    reasons: Object.freeze([...input.reasons]),
    requiredCapabilities: Object.freeze([...input.requiredCapabilities]),
    metadata: Object.freeze({ ...input.metadata }),
  });
}
