import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("runContext clasifica la intención antes del resto del flujo", async () => {
  const runtime = new RaiRuntimeService();
  const result = await runtime.runContext({
    context: createRaiContext({
      message: "Quiero hacer un regalo de cumpleaños a mis gemelas",
      sessionId: "m3-1-gemelas",
    }),
  });

  assert.equal(result.context.conversation.intent?.primary, "CREATE_GIFT");
  assert.equal(
    (result.data.intentClassification as { primary?: string } | undefined)?.primary,
    "CREATE_GIFT",
  );
  assert.equal(result.trace[0]?.stepId, "classify-intent");
  assert.equal(result.trace[0]?.status, "COMPLETED");
});

test("el estado del Runtime declara el clasificador canónico", () => {
  const runtime = new RaiRuntimeService();
  const status = runtime.status();
  assert.ok(status.skills.includes("intent-classification"));
  assert.equal(status.convergence.legacyHandlers, 0);
});
