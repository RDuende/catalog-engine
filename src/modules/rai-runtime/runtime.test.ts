import assert from "node:assert/strict";
import test from "node:test";
import { SkillRegistry, ToolRegistry } from "./registry.js";
import { RaiRuntimeService } from "./runtime.service.js";
import type { RuntimeSkill, RuntimeTool } from "./runtime.types.js";

const understand: RuntimeSkill = {
  id: "conversation-understanding",
  type: "SKILL",
  async execute(state) {
    return {
      ...state,
      context: { ...state.context, need: "regalo para clientes" },
      understanding: {
        intent: "RECOMMEND",
        patches: [],
        missingFields: ["quantity", "budget", "sustainability", "customizable"],
        nextQuestion: "¿Cuántas unidades necesitas?",
        userFacingReply: "¿Cuántas unidades necesitas?",
        confidence: 0.96,
      },
      reply: "¿Cuántas unidades necesitas?",
    };
  },
};

const gate: RuntimeTool = {
  id: "requirement-gate",
  type: "TOOL",
  async execute(state) {
    return { ...state, stop: true, status: "WAITING_FOR_USER", reply: state.understanding?.nextQuestion ?? "Faltan datos" };
  },
};

const sales: RuntimeTool = {
  id: "sales-brain",
  type: "TOOL",
  async execute(state) {
    return { ...state, status: "COMPLETED", reply: "Recomendaciones preparadas" };
  },
};

test("ejecuta skills y tools y se detiene para preguntar", async () => {
  const runtime = new RaiRuntimeService(
    new SkillRegistry().register(understand),
    new ToolRegistry().register(gate).register(sales),
  );
  const result = await runtime.run({ goal: "RECOMMEND_PRODUCTS", message: "Quiero un regalo para clientes" });
  assert.equal(result.status, "WAITING_FOR_USER");
  assert.equal(result.reply, "¿Cuántas unidades necesitas?");
  assert.equal(result.trace.length, 2);
  assert.equal(result.context.need, "regalo para clientes");
});

test("expone skills, tools y flujos registrados", () => {
  const runtime = new RaiRuntimeService(
    new SkillRegistry().register(understand),
    new ToolRegistry().register(gate).register(sales),
  );
  const status = runtime.status();
  assert.deepEqual(status.skills, ["conversation-understanding"]);
  assert.deepEqual(status.tools, ["requirement-gate", "sales-brain"]);
  assert.equal(status.flows.length, 3);
});
