import type { AITrace, ConversationUnderstanding } from "../ai-gateway/ai-gateway.types.js";
import type { SalesBrainDecision } from "../sales-brain/sales-brain.types.js";
import type { CommercialContext } from "../../core/commercial-context/index.js";

export type RuntimeGoal = "UNDERSTAND_REQUEST" | "RECOMMEND_PRODUCTS" | "PREPARE_PROPOSAL";
export type RuntimeStepKind = "SKILL" | "TOOL";
export type RuntimeStatus = "COMPLETED" | "WAITING_FOR_USER" | "FAILED";

export interface RuntimeRequest {
  readonly goal?: RuntimeGoal;
  readonly message: string;
  readonly context?: CommercialContext;
  readonly limit?: number;
  readonly recommendNow?: boolean;
}

export interface RuntimeState {
  readonly request: RuntimeRequest;
  readonly context: CommercialContext;
  readonly understanding?: ConversationUnderstanding;
  readonly aiTrace?: AITrace;
  readonly decision?: SalesBrainDecision;
  readonly reply?: string;
  readonly stop?: boolean;
  readonly status?: RuntimeStatus;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface RuntimeStepDefinition {
  readonly id: string;
  readonly kind: RuntimeStepKind;
  readonly handler: string;
  readonly optional?: boolean;
  readonly when?: "ALWAYS" | "CONTEXT_COMPLETE" | "CONTEXT_INCOMPLETE";
}

export interface RuntimeFlowDefinition {
  readonly id: string;
  readonly goal: RuntimeGoal;
  readonly steps: readonly RuntimeStepDefinition[];
}

export interface RuntimeStepTrace {
  readonly id: string;
  readonly kind: RuntimeStepKind;
  readonly handler: string;
  readonly status: "COMPLETED" | "SKIPPED" | "FAILED";
  readonly startedAt: string;
  readonly durationMs: number;
  readonly error?: string;
}

export interface RuntimeResult {
  readonly runtimeId: string;
  readonly goal: RuntimeGoal;
  readonly flowId: string;
  readonly status: RuntimeStatus;
  readonly reply: string;
  readonly context: CommercialContext;
  readonly understanding?: ConversationUnderstanding;
  readonly decision?: SalesBrainDecision;
  readonly trace: readonly RuntimeStepTrace[];
  readonly startedAt: string;
  readonly durationMs: number;
}

export interface RuntimeHandler {
  readonly id: string;
  execute(state: RuntimeState): Promise<RuntimeState>;
}

export interface RuntimeSkill extends RuntimeHandler {
  readonly type: "SKILL";
}

export interface RuntimeTool extends RuntimeHandler {
  readonly type: "TOOL";
}
