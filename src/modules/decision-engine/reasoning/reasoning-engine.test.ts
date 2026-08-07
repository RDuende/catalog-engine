import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext, withIntentClassification } from "../../../platform/runtime/context/index.js";
import { ExplainableReasoningEngine } from "./reasoning-engine.js";

const engine = new ExplainableReasoningEngine();

function context(primary: Parameters<typeof withIntentClassification>[1]["primary"], facts: Record<string, unknown> = {}) {
  const base = createRaiContext({ message: "prueba", sessionId: "reasoning-test", facts: facts as never });
  return withIntentClassification(base, {
    primary,
    confidence: 0.9,
    candidates: [],
    source: "RULE",
    classifierVersion: "test",
  });
}

test("pregunta cuando faltan datos esenciales del regalo", () => {
  const trace = engine.reason(context("CREATE_GIFT"));
  assert.equal(trace.selected.action, "ASK_QUESTION");
  assert.deepEqual(trace.facts.missingFields, ["recipientRelationship", "occasion"]);
  assert.equal(trace.decision.metadata.policyId, "missing-context");
});

test("inspira cuando el núcleo del regalo está completo pero falta señal creativa", () => {
  const trace = engine.reason(context("CREATE_GIFT", {
    recipientRelationship: "hijas",
    occasion: "cumpleaños",
  }));
  assert.equal(trace.selected.action, "BUILD_STORY");
  assert.equal(trace.decision.requiredCapabilities.includes("story.discover"), true);
});

test("crea propuesta cuando existe contexto creativo suficiente", () => {
  const trace = engine.reason(context("CREATE_GIFT", {
    recipientRelationship: "hijas",
    occasion: "cumpleaños",
    recipientInterests: "superhéroes",
  }));
  assert.equal(trace.selected.action, "CREATE_PROPOSAL");
  assert.ok(trace.candidates.length >= 2);
});

test("prioriza soporte humano sobre cualquier otra política", () => {
  const trace = engine.reason(context("HUMAN_SUPPORT"));
  assert.equal(trace.selected.action, "ESCALATE");
  assert.equal(trace.selected.score, 1);
});
