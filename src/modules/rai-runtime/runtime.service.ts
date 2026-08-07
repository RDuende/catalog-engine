import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { RuntimeFlowRegistry } from "./flow-registry.js";
import { SkillRegistry, ToolRegistry } from "./registry.js";
import { ConversationUnderstandingSkill, RequirementGateTool, RuntimeResponseSkill, SalesBrainTool } from "./runtime.handlers.js";
import { IntentClassificationSkill } from "./intent-classification.skill.js";
import { ConversationStateResolutionSkill } from "./conversation-state-resolution.skill.js";
import { ExplainableReasoningSkill } from "./explainable-reasoning.skill.js";
import { CapabilitySelectionSkill } from "./capability-selection.skill.js";
import { FastPathOptimizationSkill } from "./fast-path-optimization.skill.js";
import { FastPathOptimizer } from "../runtime-performance/index.js";
import { defaultRuntimeFlows } from "./runtime.flows.js";
import { buildRuntimeMetrics } from "./runtime-metrics.js";
import type { RaiContext, RuntimeExecutionResult } from "../../platform/runtime/contracts/index.js";
import { toLegacyRuntimeRequest, toRuntimeExecutionResult } from "./runtime-contract-adapter.js";
import { createRaiContext, withCommercialContext, withIntentClassification } from "../../platform/runtime/context/index.js";
import type { RuntimeContractInput } from "./runtime-contract-adapter.js";
import type { RuntimeDecisionTrace, RuntimeGoal, RuntimeRequest, RuntimeResult, RuntimeState, RuntimeStepTrace } from "./runtime.types.js";
import { assertCanonicalHandler, buildRuntimeConvergenceReport, type RuntimeEnforcementMode } from "./runtime-enforcement.js";
import { RuntimeEntryPointMetrics } from "./runtime-entrypoint-metrics.js";
import type { RuntimeRetirementReadinessPolicy } from "./runtime-retirement-readiness.js";
import {
  RuntimeLegacyEntryPointDisabledError,
  type RuntimeLegacyEntryPointPolicy,
} from "./runtime-legacy-policy.js";

function contextComplete(state: RuntimeState): boolean {
  const missing = state.data.missingFields;
  return Array.isArray(missing) ? missing.length === 0 : false;
}

export class RaiRuntimeService {
  readonly skills: SkillRegistry;
  readonly tools: ToolRegistry;
  readonly flows: RuntimeFlowRegistry;
  readonly entryPointMetrics: RuntimeEntryPointMetrics;

  constructor(
    skills?: SkillRegistry,
    tools?: ToolRegistry,
    flows?: RuntimeFlowRegistry,
    readonly legacyEntryPointPolicy: RuntimeLegacyEntryPointPolicy = "ENABLED_WITH_WARNING",
    retirementPolicy?: RuntimeRetirementReadinessPolicy,
  ) {
    this.skills = skills ?? new SkillRegistry()
      .register(new IntentClassificationSkill())
      .register(new ConversationStateResolutionSkill())
      .register(new ConversationUnderstandingSkill())
      .register(new ExplainableReasoningSkill())
      .register(new CapabilitySelectionSkill())
      .register(new FastPathOptimizationSkill())
      .register(new RuntimeResponseSkill());
    this.tools = tools ?? new ToolRegistry()
      .register(new RequirementGateTool())
      .register(new SalesBrainTool());
    this.flows = flows ?? new RuntimeFlowRegistry(defaultRuntimeFlows);
    this.entryPointMetrics = new RuntimeEntryPointMetrics(legacyEntryPointPolicy, retirementPolicy);
    this.assertHandlersExist();
  }

  status() {
    const convergence = this.convergence();
    return {
      runtime: "rai-runtime-intelligence-v1",
      canonicalEntryPoint: "runContext",
      convergence,
      entryPoints: this.entryPointMetrics.report(),
      skills: this.skills.list(),
      tools: this.tools.list(),
      flows: this.flows.list().map((flow) => ({
        id: flow.id,
        goal: flow.goal,
        steps: flow.steps.map((step) => ({ id: step.id, kind: step.kind, handler: step.handler, when: step.when ?? "ALWAYS" })),
      })),
    };
  }

  convergence() {
    return buildRuntimeConvergenceReport([
      ...this.skills.values().map((handler) => ({ handler, kind: "SKILL" as const })),
      ...this.tools.values().map((handler) => ({ handler, kind: "TOOL" as const })),
    ]);
  }

  /** Canonical M2 runtime entry point. All handlers are enforced as RaiContext-native. */
  async runContext(input: RuntimeContractInput): Promise<RuntimeExecutionResult> {
    this.entryPointMetrics.record("runContext");
    return this.executeContract(input);
  }

  /** @deprecated Use runContext. Kept during M2 convergence. */
  async runContract(input: RuntimeContractInput): Promise<RuntimeExecutionResult> {
    this.assertLegacyEntryPointEnabled("runContract");
    this.entryPointMetrics.record("runContract");
    return this.executeContract(input);
  }

  /** Legacy entry point. It now constructs the canonical RaiContext. */
  async run(request: RuntimeRequest): Promise<RuntimeResult> {
    this.assertLegacyEntryPointEnabled("run");
    this.entryPointMetrics.record("run");
    const context = createRaiContext({
      message: request.message,
      sessionId: `legacy-${randomUUID()}`,
      facts: request.context,
      metadata: { source: "rai-runtime.run", legacy: true },
    });
    return this.execute(request, context, "REPORT");
  }

  private assertLegacyEntryPointEnabled(entryPoint: "run" | "runContract"): void {
    if (this.legacyEntryPointPolicy === "DISABLED") {
      throw new RuntimeLegacyEntryPointDisabledError(entryPoint);
    }
  }

  private async executeContract(input: RuntimeContractInput): Promise<RuntimeExecutionResult> {
    const request = toLegacyRuntimeRequest(input);
    const result = await this.execute(request, input.context, "STRICT");
    return toRuntimeExecutionResult(result.raiContext, result);
  }

  private async execute(request: RuntimeRequest, raiContext: RaiContext, enforcementMode: RuntimeEnforcementMode): Promise<RuntimeResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const runtimeId = randomUUID();
    const goal: RuntimeGoal = request.goal ?? "RECOMMEND_PRODUCTS";
    const flow = this.flows.get(goal);
    let state: RuntimeState = {
      request,
      raiContext,
      context: toLegacyRuntimeRequest({ context: raiContext }).context ?? {},
      data: {},
    };
    const trace: RuntimeStepTrace[] = [];

    for (const step of flow.steps) {
      const complete = contextComplete(state);
      const shouldSkip = step.when === "CONTEXT_COMPLETE" ? !complete : step.when === "CONTEXT_INCOMPLETE" ? complete : false;
      if (shouldSkip) {
        trace.push({ id: step.id, kind: step.kind, handler: step.handler, status: "SKIPPED", startedAt: new Date().toISOString(), durationMs: 0 });
        continue;
      }
      const stepStartedAt = new Date().toISOString();
      const stepStarted = performance.now();
      const handler = step.kind === "SKILL" ? this.skills.get(step.handler) : this.tools.get(step.handler);
      if (enforcementMode === "STRICT") assertCanonicalHandler(handler, flow);
      try {
        state = await handler.execute(state);
        const synchronizedContext = withCommercialContext(state.raiContext, state.context);
        state = {
          ...state,
          raiContext: state.intentClassification
            ? withIntentClassification(synchronizedContext, state.intentClassification)
            : synchronizedContext,
        };
        trace.push({ id: step.id, kind: step.kind, handler: step.handler, status: "COMPLETED", startedAt: stepStartedAt, durationMs: Number((performance.now() - stepStarted).toFixed(2)) });
        if (state.stop) break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        trace.push({ id: step.id, kind: step.kind, handler: step.handler, status: "FAILED", startedAt: stepStartedAt, durationMs: Number((performance.now() - stepStarted).toFixed(2)), error: message });
        if (!step.optional) return this.result(runtimeId, goal, flow.id, "FAILED", message, state, trace, startedAt, started);
      }
    }

    const status = state.status ?? (state.stop ? "WAITING_FOR_USER" : "COMPLETED");
    return this.result(runtimeId, goal, flow.id, status, state.reply ?? state.decision?.reply ?? "Proceso completado.", state, trace, startedAt, started);
  }

  private result(runtimeId: string, goal: RuntimeGoal, flowId: string, status: RuntimeResult["status"], reply: string, state: RuntimeState, trace: RuntimeStepTrace[], startedAt: string, started: number): RuntimeResult {
    const actualRuntimeMs = Number((performance.now() - started).toFixed(2));
    const performanceReport = state.performanceAssessment
      ? new FastPathOptimizer().complete(state.performanceAssessment, actualRuntimeMs)
      : undefined;
    return {
      runtimeId,
      goal,
      flowId,
      status,
      reply,
      context: state.context,
      raiContext: state.raiContext,
      intentClassification: state.intentClassification,
      conversationStateResolution: state.conversationStateResolution,
      reasoningTrace: state.reasoningTrace,
      reasoningDecision: state.reasoningDecision,
      capabilitySelection: state.capabilitySelection,
      performanceAssessment: state.performanceAssessment,
      performanceReport,
      understanding: state.understanding,
      aiTrace: state.aiTrace,
      decision: state.decision,
      data: state.data,
      trace,
      decisionTrace: state.data.decisionTrace as RuntimeDecisionTrace | undefined,
      metrics: buildRuntimeMetrics(trace, actualRuntimeMs, state.aiTrace?.usage),
      startedAt,
      durationMs: actualRuntimeMs,
    };
  }

  private assertHandlersExist(): void {
    for (const flow of this.flows.list()) {
      for (const step of flow.steps) {
        if (step.kind === "SKILL") this.skills.get(step.handler);
        else this.tools.get(step.handler);
      }
    }
  }
}
