import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("el Runtime conserva la traza explicable y expone su decisión", async () => {
  const runtime = new RaiRuntimeService();
  const result = await runtime.runContext({
    context: createRaiContext({
      message: "Quiero hacer un regalo para mis gemelas",
      sessionId: "runtime-reasoning",
      facts: { recipientRelationship: "hijas", occasion: "cumpleaños" },
    }),
    goal: "UNDERSTAND_REQUEST",
  });

  const trace = result.data.reasoningTrace as { selected: { action: string }; engineVersion: string };
  assert.equal(trace.engineVersion, "m3.3-explainable-reasoning-v1");
  assert.equal(["BUILD_STORY", "CREATE_PROPOSAL"].includes(trace.selected.action), true);
  assert.equal(result.trace.some((step) => step.stepId === "reason"), true);
});
