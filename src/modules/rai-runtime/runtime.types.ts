import type { AITrace } from "../ai-gateway/ai-gateway.types.js";
import type { ConversationUnderstanding } from "../../ai/conversation/conversation.types.js";
import type { SalesBrainDecision } from "../sales-brain/sales-brain.types.js";
import type { CommercialContext, CommercialContextField } from "../../core/commercial-context/index.js";
import type { RuntimeMetrics } from "./runtime-metrics.js";
import type { CapabilitySelection, ConversationStateResolution, Decision, RaiContext, RaiIntentClassification, ReasoningTrace, RuntimePerformanceAssessment, RuntimePerformanceReport } from "../../platform/runtime/contracts/index.js";

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
  /** Canonical context carried across every runtime step. */
  readonly raiContext: RaiContext;
  readonly context: CommercialContext;
  readonly intentClassification?: RaiIntentClassification;
  readonly conversationStateResolution?: ConversationStateResolution;
  readonly reasoningTrace?: ReasoningTrace;
  readonly reasoningDecision?: Decision;
  readonly capabilitySelection?: CapabilitySelection;
  readonly performanceAssessment?: RuntimePerformanceAssessment;
  readonly performanceReport?: RuntimePerformanceReport;
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

export interface RuntimeDecisionTrace {
  readonly policyId: string;
  readonly requiredFields: readonly CommercialContextField[];
  readonly missingRequired: readonly CommercialContextField[];
  readonly missingOptional: readonly CommercialContextField[];
  readonly ready: boolean;
  readonly selectedQuestion?: { readonly field: CommercialContextField; readonly question: string; readonly score: number; readonly reason: string; readonly blocking: boolean; };
  readonly alternatives: readonly { readonly field: CommercialContextField; readonly score: number; readonly reason: string; readonly blocking: boolean; }[];
  readonly decision: "ASK_REQUIRED" | "CONTINUE" | "CONTINUE_WITH_OPTIONAL_GAPS";
  readonly reason: string;
}

export interface RuntimeResult {
  readonly runtimeId: string;
  readonly goal: RuntimeGoal;
  readonly flowId: string;
  readonly status: RuntimeStatus;
  readonly reply: string;
  readonly context: CommercialContext;
  readonly raiContext: RaiContext;
  readonly intentClassification?: RaiIntentClassification;
  readonly conversationStateResolution?: ConversationStateResolution;
  readonly reasoningTrace?: ReasoningTrace;
  readonly reasoningDecision?: Decision;
  readonly capabilitySelection?: CapabilitySelection;
  readonly performanceAssessment?: RuntimePerformanceAssessment;
  readonly performanceReport?: RuntimePerformanceReport;
  readonly understanding?: ConversationUnderstanding;
  readonly aiTrace?: AITrace;
  readonly decision?: SalesBrainDecision;
  readonly data: Readonly<Record<string, unknown>>;
  readonly trace: readonly RuntimeStepTrace[];
  readonly decisionTrace?: RuntimeDecisionTrace;
  readonly metrics: RuntimeMetrics;
  readonly startedAt: string;
  readonly durationMs: number;
}

export interface RuntimeHandler {
  readonly id: string;
  /** Declares that the handler consumes RaiContext as its source of truth. */
  readonly contextMode?: "RAI_CONTEXT" | "LEGACY";
  execute(state: RuntimeState): Promise<RuntimeState>;
}

export interface RuntimeSkill extends RuntimeHandler {
  readonly type: "SKILL";
}

export interface RuntimeTool extends RuntimeHandler {
  readonly type: "TOOL";
}
