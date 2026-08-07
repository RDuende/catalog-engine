import { createDecision, type Decision, type RaiContext, type RuntimeExecutionResult } from "../../platform/runtime/contracts/index.js";
import { isCommercialContext } from "../../core/commercial-context/index.js";
import type { RuntimeRequest, RuntimeResult } from "./runtime.types.js";

export interface RuntimeContractInput {
  readonly context: RaiContext;
  readonly goal?: RuntimeRequest["goal"];
  readonly limit?: number;
  readonly recommendNow?: boolean;
}

export function toLegacyRuntimeRequest(input: RuntimeContractInput): RuntimeRequest {
  return {
    goal: input.goal,
    message: input.context.conversation.message,
    context: isCommercialContext(input.context.conversation.facts)
      ? input.context.conversation.facts
      : {},
    limit: input.limit,
    recommendNow: input.recommendNow,
  };
}

function inferDecision(result: RuntimeResult): Decision {
  if (result.status === "FAILED") {
    return createDecision({
      nextAction: "ESCALATE",
      confidence: 1,
      reasons: [{ code: "RUNTIME_FAILED", message: result.reply }],
      requiredCapabilities: [],
      reply: result.reply,
      metadata: { goal: result.goal, flowId: result.flowId },
    });
  }

  if (result.status === "WAITING_FOR_USER") {
    return createDecision({
      nextAction: "ASK_QUESTION",
      confidence: result.understanding?.confidence ?? 0.8,
      reasons: [{ code: "CONTEXT_INCOMPLETE", message: result.decisionTrace?.reason ?? "Se necesita información adicional" }],
      requiredCapabilities: [],
      reply: result.reply,
      metadata: { missingFields: result.understanding?.missingFields ?? [] },
    });
  }

  if (result.reasoningDecision) {
    return createDecision({
      ...result.reasoningDecision,
      reply: result.reasoningDecision.reply ?? result.reply,
      metadata: {
        ...result.reasoningDecision.metadata,
        goal: result.goal,
        flowId: result.flowId,
      },
    });
  }

  const nextAction = result.goal === "PREPARE_PROPOSAL"
    ? "CREATE_PROPOSAL"
    : result.goal === "RECOMMEND_PRODUCTS"
      ? "SEARCH_KNOWLEDGE"
      : "COMPLETE";

  return createDecision({
    nextAction,
    confidence: result.understanding?.confidence ?? 1,
    reasons: [{ code: "FLOW_COMPLETED", message: `Flujo ${result.flowId} completado` }],
    requiredCapabilities: [],
    reply: result.reply,
    metadata: { goal: result.goal, flowId: result.flowId },
  });
}

export function toRuntimeExecutionResult(
  context: RaiContext,
  result: RuntimeResult,
): RuntimeExecutionResult {
  return {
    runtimeId: result.runtimeId,
    status: result.status,
    context,
    decision: inferDecision(result),
    data: {
      ...result.data,
      capabilitySelection: result.capabilitySelection,
      performanceAssessment: result.performanceAssessment,
      performanceReport: result.performanceReport,
    },
    trace: result.trace.map((entry) => ({
      stepId: entry.id,
      status: entry.status,
      durationMs: entry.durationMs,
      error: entry.error,
    })),
    durationMs: result.durationMs,
  };
}
