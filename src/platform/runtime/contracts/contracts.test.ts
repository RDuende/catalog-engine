import assert from "node:assert/strict";
import test from "node:test";
import { createDecision, isNextAction, type RaiContext, type RuntimeCapability } from "./index.js";
import { success } from "../../../core/shared/result.js";

test("valida decisiones y congela sus colecciones", () => {
  const decision = createDecision({
    nextAction: "ASK_QUESTION",
    confidence: 0.9,
    reasons: [{ code: "MISSING_FIELD", message: "Falta la ocasión" }],
    requiredCapabilities: [],
    reply: "¿Para qué ocasión es?",
    metadata: { field: "occasion" },
  });

  assert.equal(decision.nextAction, "ASK_QUESTION");
  assert.equal(Object.isFrozen(decision), true);
  assert.equal(Object.isFrozen(decision.reasons), true);
  assert.throws(() => createDecision({ ...decision, confidence: 1.1 }), /entre 0 y 1/);
});

test("reconoce acciones runtime publicadas", () => {
  assert.equal(isNextAction("FAST_REPLY"), true);
  assert.equal(isNextAction("UNKNOWN"), false);
});

test("una capability solo depende del contrato RaiContext", async () => {
  const capability: RuntimeCapability<string, string> = {
    id: "echo",
    version: "1.0.0",
    async execute(_context, request) {
      return success(request.input.toUpperCase());
    },
  };

  const context: RaiContext = {
    requestId: "req-1",
    correlationId: "corr-1",
    actor: { role: "ANONYMOUS" },
    session: { sessionId: "ses-1", state: "WELCOME" },
    conversation: { message: "hola" },
  };

  const result = await capability.execute(context, { input: "rai" });
  assert.deepEqual(result, { ok: true, value: "RAI" });
});
