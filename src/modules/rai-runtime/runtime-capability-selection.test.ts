import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("runtime selecciona capability después del razonamiento", async () => {
  const runtime = new RaiRuntimeService();
  const result = await runtime.runContext({ context: createRaiContext({ message: "Quiero hacer un regalo para mi madre", sessionId: "m3-4" }) });
  const selection = result.data.capabilitySelection as { capabilityId?: string; executionPath?: string } | undefined;
  assert.ok(selection?.capabilityId);
  assert.ok(["FAST_PATH", "ADVANCED_PATH"].includes(selection.executionPath ?? ""));
  const steps = result.trace.map((item) => item.stepId);
  assert.ok(steps.indexOf("select-capability") > steps.indexOf("reason"));
});
