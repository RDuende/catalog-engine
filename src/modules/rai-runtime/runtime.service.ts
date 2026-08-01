import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { SkillRegistry, ToolRegistry } from "./registry.js";
import { ConversationUnderstandingSkill, RequirementGateTool, SalesBrainTool } from "./runtime.handlers.js";
import type { RuntimeFlowDefinition, RuntimeGoal, RuntimeRequest, RuntimeResult, RuntimeState, RuntimeStepTrace } from "./runtime.types.js";

const flows: readonly RuntimeFlowDefinition[] = [
  {
    id: "commercial-conversation",
    goal: "UNDERSTAND_REQUEST",
    steps: [
      { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
      { id: "requirements", kind: "TOOL", handler: "requirement-gate" },
    ],
  },
  {
    id: "commercial-recommendation",
    goal: "RECOMMEND_PRODUCTS",
    steps: [
      { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
      { id: "requirements", kind: "TOOL", handler: "requirement-gate" },
      { id: "decide", kind: "TOOL", handler: "sales-brain", when: "CONTEXT_COMPLETE" },
    ],
  },
  {
    id: "commercial-proposal",
    goal: "PREPARE_PROPOSAL",
    steps: [
      { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
      { id: "requirements", kind: "TOOL", handler: "requirement-gate" },
      { id: "decide", kind: "TOOL", handler: "sales-brain", when: "CONTEXT_COMPLETE" },
    ],
  },
];

function contextComplete(state: RuntimeState): boolean {
  return ["need", "quantity", "budget", "sustainability", "customizable"].every((field) => {
    const value = state.context[field as keyof typeof state.context];
    return value !== undefined && value !== "";
  });
}

export class RaiRuntimeService {
  readonly skills: SkillRegistry;
  readonly tools: ToolRegistry;

  constructor(skills?: SkillRegistry, tools?: ToolRegistry, private readonly definitions = flows) {
    this.skills = skills ?? new SkillRegistry().register(new ConversationUnderstandingSkill());
    this.tools = tools ?? new ToolRegistry().register(new RequirementGateTool()).register(new SalesBrainTool());
  }

  status() {
    return {
      skills: this.skills.list(),
      tools: this.tools.list(),
      flows: this.definitions.map((flow) => ({ id: flow.id, goal: flow.goal, steps: flow.steps.length })),
    };
  }

  async run(request: RuntimeRequest): Promise<RuntimeResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const goal: RuntimeGoal = request.goal ?? "RECOMMEND_PRODUCTS";
    const flow = this.definitions.find((item) => item.goal === goal);
    if (!flow) throw new Error(`No existe un flujo para el objetivo ${goal}.`);

    let state: RuntimeState = { request, context: request.context ?? {}, data: {} };
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
      try {
        const handler = step.kind === "SKILL" ? this.skills.get(step.handler) : this.tools.get(step.handler);
        state = await handler.execute(state);
        trace.push({ id: step.id, kind: step.kind, handler: step.handler, status: "COMPLETED", startedAt: stepStartedAt, durationMs: Number((performance.now() - stepStarted).toFixed(2)) });
        if (state.stop) break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        trace.push({ id: step.id, kind: step.kind, handler: step.handler, status: "FAILED", startedAt: stepStartedAt, durationMs: Number((performance.now() - stepStarted).toFixed(2)), error: message });
        if (!step.optional) {
          return { runtimeId: randomUUID(), goal, flowId: flow.id, status: "FAILED", reply: message, context: state.context, understanding: state.understanding, decision: state.decision, trace, startedAt, durationMs: Number((performance.now() - started).toFixed(2)) };
        }
      }
    }

    const status = state.status ?? (state.stop ? "WAITING_FOR_USER" : "COMPLETED");
    return {
      runtimeId: randomUUID(),
      goal,
      flowId: flow.id,
      status,
      reply: state.reply ?? state.decision?.reply ?? "Proceso completado.",
      context: state.context,
      understanding: state.understanding,
      decision: state.decision,
      trace,
      startedAt,
      durationMs: Number((performance.now() - started).toFixed(2)),
    };
  }
}
