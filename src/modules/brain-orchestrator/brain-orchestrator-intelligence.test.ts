import assert from "node:assert/strict";
import test from "node:test";

import {
  BrainOrchestratorIntelligenceService,
} from "./brain-orchestrator-intelligence.service.js";

test("descubrimiento mantiene cerrado Proposal Gate", async () => {
  const result =
    await new BrainOrchestratorIntelligenceService()
      .run({
        conversationMessage:
          "No sé qué regalarle a mi padre",
        recipientLabel:
          "mi padre",
      });

  assert.equal(
    result.action,
    "ASK",
  );

  assert.equal(
    result.context.intent !==
      undefined,
    true,
  );

  assert.equal(
    result.stages.some(
      (stage) =>
        stage.id ===
        "INTENT",
    ),
    true,
  );
});

test("Hacer propuestas abre el pipeline completo", async () => {
  const result =
    await new BrainOrchestratorIntelligenceService()
      .run({
        conversationMessage:
          "Hacer propuestas",
        recipientLabel:
          "mi padre",
        occasion:
          "cumpleaños",
        budget: 70,
        interests: [
          "motocross",
        ],
        desiredImpact: [
          "sorprender",
        ],
        candidates: [
          {
            id: "a",
            name:
              "Termo motocross",
            category:
              "botellas",
            price: 24,
            stock: 10,
            score: 0.9,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
          },
          {
            id: "b",
            name:
              "Llavero motocross",
            category:
              "llaveros",
            price: 8,
            stock: 10,
            score: 0.8,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
          },
        ],
      });

  assert.equal(
    result.action,
    "PROPOSALS_READY",
  );

  assert.equal(
    result.executionOrder.includes(
      "PROPOSAL",
    ),
    true,
  );

  assert.equal(
    result.stages.some(
      (stage) =>
        stage.id ===
        "ORCHESTRATOR" &&
        stage.status ===
        "COMPLETE",
    ),
    true,
  );
});

test("reinicio sólo sucede con intención explícita", async () => {
  const normal =
    await new BrainOrchestratorIntelligenceService()
      .run({
        conversationMessage:
          "seguimos",
        recipientLabel:
          "mi padre",
      });

  assert.notEqual(
    normal.action,
    "RESET",
  );

  const reset =
    await new BrainOrchestratorIntelligenceService()
      .run({
        conversationMessage:
          "empezar de nuevo",
      });

  assert.equal(
    reset.action,
    "RESET",
  );
});

test("precio usa ruta directa y no ejecuta Proposal Brain", async () => {
  const result =
    await new BrainOrchestratorIntelligenceService()
      .run({
        conversationMessage:
          "¿Cuánto cuesta esta taza?",
        hasSelectedProduct:
          true,
      });

  assert.equal(
    result.action,
    "DIRECT",
  );

  assert.equal(
    result.executionOrder.includes(
      "PRODUCT",
    ),
    true,
  );

  assert.equal(
    result.executionOrder.includes(
      "PROPOSAL",
    ),
    false,
  );
});

test("Emotion Brain participa cuando el plan lo requiere", async () => {
  const result =
    await new BrainOrchestratorIntelligenceService()
      .run({
        conversationMessage:
          "No sé qué regalar, quiero emocionarlo mucho",
        recipientLabel:
          "mi padre",
      });

  assert.equal(
    result.stages.some(
      (stage) =>
        stage.id ===
          "EMOTION" &&
        stage.status ===
          "COMPLETE",
    ),
    true,
  );
});
