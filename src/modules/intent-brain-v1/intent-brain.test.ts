import assert from "node:assert/strict";
import test from "node:test";

import {
  IntentBrainService,
} from "./intent-brain.service.js";
import {
  intentContextForConversation,
  intentContextForOrchestrator,
} from "./intent-brain.adapters.js";

test("detecta descubrimiento de regalo", () => {
  const result =
    new IntentBrainService()
      .analyze({
        message:
          "No sé qué regalarle a mi padre",
      });

  assert.equal(
    result.primaryIntent,
    "DISCOVER_GIFT",
  );

  assert.equal(
    result.executionPlan.mode,
    "DISCOVERY",
  );

  assert.equal(
    result.executionPlan
      .shouldGenerateProposals,
    false,
  );
});

test("Hacer propuestas autoriza explícitamente Proposal Brain", () => {
  const result =
    new IntentBrainService()
      .analyze({
        message:
          "Hacer propuestas",
        hasCandidates: true,
      });

  assert.equal(
    result.primaryIntent,
    "MAKE_PROPOSALS",
  );

  assert.equal(
    result.executionPlan
      .shouldGenerateProposals,
    true,
  );

  assert.equal(
    result.executionPlan.steps.some(
      (step) =>
        step.brain ===
        "PROPOSAL",
    ),
    true,
  );
});

test("reiniciar sólo se activa con petición explícita", () => {
  const normal =
    new IntentBrainService()
      .analyze({
        message:
          "seguimos con el regalo",
      });

  assert.equal(
    normal.executionPlan
      .shouldResetJourney,
    false,
  );

  const reset =
    new IntentBrainService()
      .analyze({
        message:
          "empezar de nuevo",
      });

  assert.equal(
    reset.primaryIntent,
    "RESTART_GIFT",
  );

  assert.equal(
    reset.executionPlan
      .shouldResetJourney,
    true,
  );
});

test("distingue precio de disponibilidad", () => {
  const brain =
    new IntentBrainService();

  const price =
    brain.analyze({
      message:
        "¿Cuánto cuesta esta taza?",
      hasSelectedProduct: true,
    });

  const stock =
    brain.analyze({
      message:
        "¿Está disponible esta taza?",
      hasSelectedProduct: true,
    });

  assert.equal(
    price.primaryIntent,
    "CHECK_PRICE",
  );

  assert.equal(
    stock.primaryIntent,
    "CHECK_AVAILABILITY",
  );
});

test("expone adaptadores para Conversation y Orchestrator", () => {
  const result =
    new IntentBrainService()
      .analyze({
        message:
          "Hacer propuestas",
      });

  const conversation =
    intentContextForConversation(
      result,
    );

  const orchestrator =
    intentContextForOrchestrator(
      result,
    );

  assert.equal(
    conversation
      .proposalRequested,
    true,
  );

  assert.equal(
    orchestrator
      .executionOrder.includes(
        "PROPOSAL",
      ),
    true,
  );
});
