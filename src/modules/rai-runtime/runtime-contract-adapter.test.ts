import assert from "node:assert/strict";
import test from "node:test";
import {
  isNextAction,
  type RaiContext,
} from "../../platform/runtime/contracts/index.js";
import { RaiRuntimeService } from "./runtime.service.js";

function context(message: string): RaiContext {
  return {
    requestId: "req-contract",
    correlationId: "corr-contract",
    actor: { role: "ANONYMOUS", locale: "es-ES" },
    session: { sessionId: "ses-contract", state: "DISCOVER" },
    conversation: { message, facts: {} },
  };
}

test("rai-runtime expone el nuevo contrato sin retirar run legacy", async () => {
  const runtime = new RaiRuntimeService();

  assert.equal(typeof runtime.run, "function");
  assert.equal(typeof runtime.runContract, "function");
  assert.equal(typeof runtime.runContext, "function");

  const result = await runtime.runContract({
    context: context("Quiero un regalo para mi madre"),
    goal: "UNDERSTAND_REQUEST",
  });

  assert.equal(result.context.correlationId, "corr-contract");
  assert.equal(isNextAction(result.decision.nextAction), true);
  assert.equal(result.durationMs >= 0, true);

  const entryPoints = runtime.status().entryPoints;

  assert.equal(entryPoints.totalCalls, 1);
  assert.equal(entryPoints.canonicalCalls, 0);
  assert.equal(entryPoints.deprecatedCalls, 1);
  assert.equal(entryPoints.retirementReady, false);
  assert.equal(entryPoints.retirementReadiness.zeroLegacyUsage, false);
  assert.equal(
    entryPoints.entries.find(
      (entry) => entry.entryPoint === "runContract",
    )?.calls,
    1,
  );
});
