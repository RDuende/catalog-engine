import assert from "node:assert/strict";
import test from "node:test";
import { createDecision } from "../../platform/runtime/contracts/index.js";
import { CapabilitySelector } from "../capability-selection/index.js";
import { FastPathOptimizer } from "./fast-path-optimizer.js";

test("mantiene preguntas deterministas en Fast Path sin indicador", () => {
  const selection = new CapabilitySelector().select(createDecision({
    nextAction: "ASK_QUESTION", confidence: 1, reasons: [], requiredCapabilities: [], metadata: {},
  }));
  const assessment = new FastPathOptimizer().assess(selection);
  assert.equal(assessment.latencyClass, "FAST");
  assert.equal(assessment.requiresAsyncExecution, false);
  assert.equal(assessment.activityMode, "NONE");
  assert.equal(assessment.acknowledgementBudgetMs, 100);
});

test("envía imágenes al Advanced Path con progreso visible", () => {
  const selection = new CapabilitySelector().select(createDecision({
    nextAction: "GENERATE_IMAGE", confidence: 1, reasons: [], requiredCapabilities: [], metadata: {},
  }));
  const assessment = new FastPathOptimizer().assess(selection);
  assert.equal(assessment.latencyClass, "ADVANCED");
  assert.equal(assessment.requiresAsyncExecution, true);
  assert.equal(assessment.activityMode, "PROGRESS");
  assert.equal(assessment.acknowledgementBudgetMs, 300);
});

test("informa brechas de acknowledgement y ejecución", () => {
  const selection = new CapabilitySelector().select(createDecision({
    nextAction: "ASK_QUESTION", confidence: 1, reasons: [], requiredCapabilities: [], metadata: {},
  }));
  const optimizer = new FastPathOptimizer();
  const assessment = optimizer.assess(selection);
  assert.equal(optimizer.complete(assessment, 150).slaStatus, "EXECUTION_BREACH");
});
