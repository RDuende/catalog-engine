import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RuntimeFlowRegistry } from "./flow-registry.js";
import { SkillRegistry, ToolRegistry } from "./registry.js";
import { RuntimeContextEnforcementError } from "./runtime-enforcement.js";
import { RaiRuntimeService } from "./runtime.service.js";
import type { RuntimeSkill, RuntimeTool } from "./runtime.types.js";

const canonicalResponse: RuntimeSkill = {
  id: "runtime-response",
  type: "SKILL",
  contextMode: "RAI_CONTEXT",
  async execute(state) { return { ...state, reply: state.reply ?? "ok" }; },
};

const canonicalGate: RuntimeTool = {
  id: "requirement-gate",
  type: "TOOL",
  contextMode: "RAI_CONTEXT",
  async execute(state) { return { ...state, data: { ...state.data, missingFields: [] } }; },
};

const canonicalSales: RuntimeTool = {
  id: "sales-brain",
  type: "TOOL",
  contextMode: "RAI_CONTEXT",
  async execute(state) { return { ...state, reply: "propuesta", status: "COMPLETED" }; },
};

function runtimeWith(understanding: RuntimeSkill): RaiRuntimeService {
  return new RaiRuntimeService(
    new SkillRegistry().register(understanding).register(canonicalResponse),
    new ToolRegistry().register(canonicalGate).register(canonicalSales),
    new RuntimeFlowRegistry([{
      id: "enforcement-flow",
      goal: "RECOMMEND_PRODUCTS",
      steps: [
        { id: "understand", kind: "SKILL", handler: "conversation-understanding" },
        { id: "gate", kind: "TOOL", handler: "requirement-gate" },
        { id: "sales", kind: "TOOL", handler: "sales-brain" },
        { id: "response", kind: "SKILL", handler: "runtime-response" },
      ],
    }]),
  );
}

test("runContext bloquea handlers legacy en flujos canónicos", async () => {
  const legacy: RuntimeSkill = {
    id: "conversation-understanding",
    type: "SKILL",
    async execute(state) { return state; },
  };
  const runtime = runtimeWith(legacy);
  await assert.rejects(
    runtime.runContext({
      context: createRaiContext({ message: "hola", sessionId: "ses-enforce" }),
      goal: "RECOMMEND_PRODUCTS",
    }),
    (error: unknown) => error instanceof RuntimeContextEnforcementError
      && error.handlerId === "conversation-understanding",
  );
});

test("run legacy mantiene temporalmente handlers sin contextMode", async () => {
  const legacy: RuntimeSkill = {
    id: "conversation-understanding",
    type: "SKILL",
    async execute(state) { return { ...state, data: { ...state.data, missingFields: [] } }; },
  };
  const result = await runtimeWith(legacy).run({ message: "hola" });
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.raiContext.metadata?.legacy, true);
});

test("expone el grado de convergencia y los handlers legacy", () => {
  const legacy: RuntimeSkill = {
    id: "conversation-understanding",
    type: "SKILL",
    async execute(state) { return state; },
  };
  const report = runtimeWith(legacy).convergence();
  assert.equal(report.totalHandlers, 4);
  assert.equal(report.canonicalHandlers, 3);
  assert.equal(report.legacyHandlers, 1);
  assert.equal(report.convergencePercent, 75);
  assert.deepEqual(report.legacyHandlerIds, ["conversation-understanding"]);
});

test("runtime por defecto está convergido al cien por cien", () => {
  const runtime = new RaiRuntimeService();
  const report = runtime.convergence();
  assert.equal(report.legacyHandlers, 0);
  assert.equal(report.convergencePercent, 100);
  assert.equal(runtime.status().canonicalEntryPoint, "runContext");
});
