import assert from "node:assert/strict";
import test from "node:test";

import {
  BrainOrchestratorService,
} from "./brain-orchestrator.service.js";
import {
  BrainBenchmarkService,
} from "./brain-benchmark.service.js";

test("pide información cuando Gift Brain no está completo", async () => {
  const result =
    await new BrainOrchestratorService()
      .run({
        recipientLabel:
          "mi padre",
      });

  assert.equal(
    result.decision.action,
    "ASK_USER",
  );

  assert.equal(
    typeof result.decision
      .nextQuestion,
    "string",
  );
});

test("genera propuestas cuando recibe candidatos", async () => {
  const result =
    await new BrainOrchestratorService()
      .run({
        recipientLabel:
          "mi padre",
        occasion:
          "cumpleaños",
        budget: 70,
        interests: [
          "motocross",
        ],
        candidates: [
          {
            id: "a",
            name:
              "Termo motocross",
            category:
              "botellas",
            price: 24,
            stock: 5,
            score: 0.9,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
          },
          {
            id: "b",
            name:
              "Llavero",
            category:
              "llaveros",
            price: 8,
            stock: 5,
            score: 0.75,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
          },
        ],
      });

  assert.equal(
    result.decision.action,
    "PROPOSALS_READY",
  );

  assert.equal(
    result.stages.some(
      (stage) =>
        stage.stage ===
          "PROPOSAL" &&
        stage.status ===
          "COMPLETE",
    ),
    true,
  );
});

test("benchmark devuelve p95 y confianza media", async () => {
  const result =
    await new BrainBenchmarkService()
      .run(
        {
          recipientLabel:
            "mi padre",
        },
        2,
      );

  assert.equal(
    result.runs,
    2,
  );

  assert.equal(
    result.p95Ms >= 0,
    true,
  );
});
