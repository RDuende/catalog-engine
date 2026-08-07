import assert from "node:assert/strict";
import test from "node:test";
import { createDecision } from "../../platform/runtime/contracts/index.js";
import { CapabilitySelector, RuntimeCapabilityRegistry } from "./index.js";

test("selecciona fast path para preguntas", () => {
  const selection = new CapabilitySelector().select(createDecision({
    nextAction: "ASK_QUESTION", confidence: 0.9, reasons: [], requiredCapabilities: [], metadata: {},
  }));
  assert.equal(selection.capabilityId, "conversation.ask-question");
  assert.equal(selection.executionPath, "FAST_PATH");
});

test("selecciona advanced path para historias e imágenes", () => {
  const selector = new CapabilitySelector();
  for (const action of ["BUILD_STORY", "GENERATE_IMAGE"] as const) {
    const selection = selector.select(createDecision({ nextAction: action, confidence: 1, reasons: [], requiredCapabilities: [], metadata: {} }));
    assert.equal(selection.executionPath, "ADVANCED_PATH");
  }
});

test("elige el proveedor habilitado con mayor prioridad", () => {
  const registry = new RuntimeCapabilityRegistry()
    .register({ capabilityId: "knowledge.search", providerId: "slow", version: "1", actions: ["SEARCH_KNOWLEDGE"], executionPath: "ADVANCED_PATH", priority: 10, enabled: true, expectedLatencyMs: 500, executionBudgetMs: 1000, acknowledgementBudgetMs: 300 })
    .register({ capabilityId: "knowledge.search", providerId: "fast", version: "1", actions: ["SEARCH_KNOWLEDGE"], executionPath: "FAST_PATH", priority: 20, enabled: true, expectedLatencyMs: 50, executionBudgetMs: 100, acknowledgementBudgetMs: 100 });
  const selection = new CapabilitySelector(registry).select(createDecision({ nextAction: "SEARCH_KNOWLEDGE", confidence: 1, reasons: [], requiredCapabilities: [], metadata: {} }));
  assert.equal(selection.providerId, "fast");
});
