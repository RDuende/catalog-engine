import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("runContext registra uso canónico sin contaminar métricas legacy", async () => {
  const runtime = new RaiRuntimeService();

  await runtime.runContext({
    context: createRaiContext({
      message: "Quiero un regalo para mi madre",
      sessionId: "session-m2-5",
    }),
  });

  const report = runtime.status().entryPoints;
  assert.equal(report.totalCalls, 1);
  assert.equal(report.canonicalCalls, 1);
  assert.equal(report.deprecatedCalls, 0);
  assert.equal(report.canonicalUsagePercent, 100);
  assert.equal(report.retirementReady, false);
  assert.equal(report.retirementReadiness.zeroLegacyUsage, true);
  assert.equal(report.retirementReadiness.canonicalVolumeComplete, false);
});

test("run legacy queda medido por separado", async () => {
  const runtime = new RaiRuntimeService();

  await runtime.run({ message: "hola" });

  const report = runtime.status().entryPoints;
  assert.equal(report.totalCalls, 1);
  assert.equal(report.canonicalCalls, 0);
  assert.equal(report.deprecatedCalls, 1);
  assert.equal(report.legacyUsagePercent, 100);
  assert.equal(report.retirementReady, false);
  assert.equal(report.entries.find((entry) => entry.entryPoint === "run")?.calls, 1);
});

test("runContract no cuenta doble como runContext", async () => {
  const runtime = new RaiRuntimeService();

  await runtime.runContract({
    context: createRaiContext({
      message: "hola",
      sessionId: "deprecated-contract",
    }),
  });

  const report = runtime.status().entryPoints;
  assert.equal(report.totalCalls, 1);
  assert.equal(report.canonicalCalls, 0);
  assert.equal(report.deprecatedCalls, 1);
  assert.equal(report.entries.find((entry) => entry.entryPoint === "runContract")?.calls, 1);
});
