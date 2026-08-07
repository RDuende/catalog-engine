import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("runtime evalúa el Fast Path después de seleccionar capability", async () => {
  const runtime = new RaiRuntimeService();
  const result = await runtime.runContext({
    context: createRaiContext({ message: "Hola", sessionId: "m3-5-fast" }),
  });
  const assessment = result.data.performanceAssessment as { activityMode?: string; acknowledgementBudgetMs?: number } | undefined;
  assert.ok(assessment);
  assert.ok(["NONE", "SUBTLE", "PROGRESS"].includes(assessment?.activityMode ?? ""));
  const steps = result.trace.map((item) => item.stepId);
  assert.ok(steps.indexOf("optimize-path") > steps.indexOf("select-capability"));
});

test("Fast Path conserva un P95 inferior a 300 ms en ejecución local", async () => {
  const durations: number[] = [];
  for (let index = 0; index < 25; index += 1) {
    const runtime = new RaiRuntimeService();
    const result = await runtime.runContext({
      context: createRaiContext({ message: "Hola", sessionId: `m3-5-${index}` }),
    });
    durations.push(result.durationMs);
  }
  const ordered = durations.sort((a, b) => a - b);
  const p95 = ordered[Math.ceil(ordered.length * 0.95) - 1];
  assert.ok(typeof p95 === "number");
  assert.ok(p95 < 300, `P95 esperado <300 ms, obtenido ${p95} ms`);
});
