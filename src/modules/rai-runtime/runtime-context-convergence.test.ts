import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RuntimeFlowRegistry } from "./flow-registry.js";
import { SkillRegistry, ToolRegistry } from "./registry.js";
import { RaiRuntimeService } from "./runtime.service.js";
import type { RuntimeSkill, RuntimeTool } from "./runtime.types.js";

const enrich: RuntimeSkill = {
  contextMode: "RAI_CONTEXT",
  id: "conversation-understanding",
  type: "SKILL",
  async execute(state) {
    assert.equal(state.raiContext.session.sessionId, "ses-native");
    return {
      ...state,
      context: { ...state.context, recipientRelationship: "madre", conversationState: "PROPOSAL" },
      data: { ...state.data, missingFields: [] },
    };
  },
};

const gate: RuntimeTool = {
  contextMode: "RAI_CONTEXT",
  id: "requirement-gate",
  type: "TOOL",
  async execute(state) { return state; },
};

const sales: RuntimeTool = {
  contextMode: "RAI_CONTEXT",
  id: "sales-brain",
  type: "TOOL",
  async execute(state) {
    assert.equal(state.raiContext.conversation.facts?.recipientRelationship, "madre");
    assert.equal(state.raiContext.session.state, "PROPOSE");
    return { ...state, reply: "Propuesta lista", status: "COMPLETED" };
  },
};

const response: RuntimeSkill = {
  contextMode: "RAI_CONTEXT",
  id: "runtime-response",
  type: "SKILL",
  async execute(state) { return state; },
};

test("el contexto canónico se sincroniza entre pasos del runtime", async () => {
  const runtime = new RaiRuntimeService(
    new SkillRegistry().register(enrich).register(response),
    new ToolRegistry().register(gate).register(sales),
    new RuntimeFlowRegistry([{
      id: "native-context-flow",
      goal: "RECOMMEND_PRODUCTS",
      steps: [
        { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
        { id: "gate", kind: "TOOL", handler: "requirement-gate" },
        { id: "sales", kind: "TOOL", handler: "sales-brain" },
        { id: "response", kind: "SKILL", handler: "runtime-response" },
      ],
    }]),
  );

  const result = await runtime.runContext({
    context: createRaiContext({
      message: "Quiero un regalo para mi madre",
      sessionId: "ses-native",
      requestId: "req-native",
      facts: {},
    }),
    goal: "RECOMMEND_PRODUCTS",
  });

  assert.equal(result.context.session.sessionId, "ses-native");
  assert.equal(result.context.session.state, "PROPOSE");
  assert.equal(result.context.conversation.facts?.recipientRelationship, "madre");
  assert.equal(result.decision.reply, "Propuesta lista");
});

test("run legacy conserva compatibilidad y devuelve el contexto canónico", async () => {
  const legacySkill: RuntimeSkill = {
    id: "conversation-understanding",
    type: "SKILL",
    async execute(state) {
      return { ...state, context: { ...state.context, need: "regalo" }, data: { ...state.data, missingFields: [] } };
    },
  };
  const runtime = new RaiRuntimeService(
    new SkillRegistry().register(legacySkill).register(response),
    new ToolRegistry().register(gate).register(sales),
    new RuntimeFlowRegistry([{
      id: "legacy-context-flow",
      goal: "RECOMMEND_PRODUCTS",
      steps: [
        { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
        { id: "gate", kind: "TOOL", handler: "requirement-gate" },
        { id: "sales", kind: "TOOL", handler: "sales-brain" },
        { id: "response", kind: "SKILL", handler: "runtime-response" },
      ],
    }]),
  );

  const result = await runtime.run({ message: "hola", context: {} });
  assert.equal(result.raiContext.metadata?.legacy, true);
  assert.equal(result.raiContext.conversation.facts?.need, "regalo");
});
