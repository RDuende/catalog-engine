import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeFlowRegistry } from "./flow-registry.js";
import { SkillRegistry, ToolRegistry } from "./registry.js";
import { RaiRuntimeService } from "./runtime.service.js";
import { IntentClassificationSkill } from "./intent-classification.skill.js";
import { ConversationStateResolutionSkill } from "./conversation-state-resolution.skill.js";
import { ExplainableReasoningSkill } from "./explainable-reasoning.skill.js";
import { CapabilitySelectionSkill } from "./capability-selection.skill.js";
import { FastPathOptimizationSkill } from "./fast-path-optimization.skill.js";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import type { RuntimeSkill, RuntimeTool } from "./runtime.types.js";

const understand: RuntimeSkill = {
  id: "conversation-understanding",
  type: "SKILL",
  contextMode: "RAI_CONTEXT",
  async execute(state) {
    const complete = state.request.message === "completo";
    return {
      ...state,
      context: complete
        ? { ...state.context, need: "regalo", quantity: 100, budget: 5, sustainability: true, customizable: true }
        : { ...state.context, need: "regalo para clientes" },
      understanding: {
        intent: "RECOMMEND",
        patches: [],
        missingFields: complete ? [] : ["quantity", "budget", "sustainability", "customizable"],
        nextQuestion: complete ? null : "¿Cuántas unidades necesitas?",
        userFacingReply: complete ? "Contexto completo" : "¿Cuántas unidades necesitas?",
        confidence: 0.96,
      },
      reply: complete ? "Contexto completo" : "¿Cuántas unidades necesitas?",
    };
  },
};

const gate: RuntimeTool = {
  id: "requirement-gate",
  type: "TOOL",
  contextMode: "RAI_CONTEXT",
  async execute(state) {
    const missing = state.understanding?.missingFields ?? [];
    if (missing.length === 0) return { ...state, data: { ...state.data, missingFields: [] } };
    return { ...state, data: { ...state.data, missingFields: missing }, stop: true, status: "WAITING_FOR_USER", reply: state.understanding?.nextQuestion ?? "Faltan datos" };
  },
};

const sales: RuntimeTool = {
  id: "sales-brain",
  type: "TOOL",
  contextMode: "RAI_CONTEXT",
  async execute(state) {
    return { ...state, status: "COMPLETED", reply: "Recomendaciones preparadas" };
  },
};

const response: RuntimeSkill = {
  id: "runtime-response",
  type: "SKILL",
  contextMode: "RAI_CONTEXT",
  async execute(state) { return state; },
};

function runtime() {
  return new RaiRuntimeService(
    new SkillRegistry()
      .register(new IntentClassificationSkill())
      .register(new ConversationStateResolutionSkill())
      .register(understand)
      .register(new ExplainableReasoningSkill())
      .register(new CapabilitySelectionSkill())
      .register(new FastPathOptimizationSkill())
      .register(response),
    new ToolRegistry().register(gate).register(sales),
  );
}

test("se detiene cuando faltan requisitos", async () => {
  const result = await runtime().runContext({
    goal: "RECOMMEND_PRODUCTS",
    context: createRaiContext({ message: "incompleto", sessionId: "runtime-incomplete" }),
  });
  assert.equal(result.status, "WAITING_FOR_USER");
  assert.equal(result.decision.reply, "¿Cuántas unidades necesitas?");
  assert.equal(result.trace.length, 7);
  assert.equal(result.context.conversation.facts?.need, "regalo para clientes");
});

test("ejecuta el flujo completo cuando el contexto está completo", async () => {
  const result = await runtime().runContext({
    goal: "RECOMMEND_PRODUCTS",
    context: createRaiContext({ message: "completo", sessionId: "runtime-complete" }),
  });
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.decision.reply, "Recomendaciones preparadas");
  assert.deepEqual(
    result.trace.map((step) => step.status),
    ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED"],
  );
});

test("valida flujos y handlers al arrancar", () => {
  assert.throws(() => new RuntimeFlowRegistry([{ id: "duplicado", goal: "UNDERSTAND_REQUEST", steps: [
    { id: "x", kind: "SKILL", handler: "a" },
    { id: "x", kind: "TOOL", handler: "b" },
  ] }]), /repite el paso/);
});

test("expone skills, tools y flujos registrados", () => {
  const status = runtime().status();
  assert.equal(status.runtime, "rai-runtime-intelligence-v1");
  assert.deepEqual(status.skills, [
    "capability-selection",
    "conversation-state-resolution",
    "conversation-understanding",
    "explainable-reasoning",
    "fast-path-optimization",
    "intent-classification",
    "runtime-response",
  ]);
  assert.deepEqual(status.tools, ["requirement-gate", "sales-brain"]);
  assert.equal(status.flows.length, 3);
});
