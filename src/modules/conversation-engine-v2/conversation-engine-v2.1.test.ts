import assert from "node:assert/strict";
import test from "node:test";

import {
  ConversationEngineV21Service,
} from "./conversation-engine-v2.1.service.js";

test("extrae destinatario, ocasión, presupuesto e interés del lenguaje natural", async () => {
  const result =
    await new ConversationEngineV21Service()
      .process({
        message:
          "Es para mi padre por su cumpleaños, le encanta el motocross y tengo 70 euros",
      });

  assert.equal(
    result.graph.facts.some(
      (fact) =>
        fact.key ===
          "recipientLabel" &&
        fact.value ===
          "mi padre",
    ),
    true,
  );

  assert.equal(
    result.graph.facts.some(
      (fact) =>
        fact.key ===
          "occasion" &&
        fact.value ===
          "cumpleaños",
    ),
    true,
  );

  assert.equal(
    result.graph.facts.some(
      (fact) =>
        fact.key ===
          "budget" &&
        fact.value === 70,
    ),
    true,
  );

  assert.equal(
    result.graph.facts.some(
      (fact) =>
        fact.key ===
          "interests" &&
        Array.isArray(
          fact.value,
        ) &&
        fact.value.includes(
          "motocross",
        ),
    ),
    true,
  );
});

test("no genera propuestas automáticamente cuando los datos mínimos están completos", async () => {
  const result =
    await new ConversationEngineV21Service()
      .process({
        message:
          "Es para mi padre, por su cumpleaños, le gusta el motocross y tengo 70 euros",
      });

  assert.equal(
    result.decision.action,
    "READY_TO_PROPOSE",
  );

  assert.equal(
    result.decision
      .showProposalButton,
    true,
  );

  assert.equal(
    result.orchestrator,
    undefined,
  );
});

test("Hacer propuestas abre el Proposal Gate", async () => {
  const engine =
    new ConversationEngineV21Service();

  const first =
    await engine.process({
      message:
        "Es para mi padre, por su cumpleaños, le gusta el motocross y tengo 70 euros",
    });

  const second =
    await engine.process({
      graph:
        first.graph,
      message:
        "Hacer propuestas",
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
    second.extraction
      .proposalRequested,
    true,
  );

  assert.equal(
    second.decision.action,
    "PROPOSALS_READY",
  );

  assert.ok(
    second.orchestrator,
  );
});

test("una respuesta numérica usa el contexto de la pregunta de presupuesto", async () => {
  const engine =
    new ConversationEngineV21Service();

  const first =
    await engine.process({
      message:
        "Es para mi padre, por su cumpleaños, le gusta el motocross",
    });

  assert.equal(
    first.decision
      .question?.key,
    "budget",
  );

  const second =
    await engine.process({
      graph:
        first.graph,
      message:
        "60",
    });

  assert.equal(
    second.graph.facts.some(
      (fact) =>
        fact.key ===
          "budget" &&
        fact.value === 60,
    ),
    true,
  );

  assert.equal(
    second.decision.action,
    "READY_TO_PROPOSE",
  );
});

test("mis padres resuelve destinatario y cantidad", async () => {
  const result =
    await new ConversationEngineV21Service()
      .process({
        message:
          "Es para mis padres",
      });

  assert.equal(
    result.graph.facts.some(
      (fact) =>
        fact.key ===
          "recipientLabel" &&
        fact.value ===
          "mis padres",
    ),
    true,
  );

  assert.equal(
    result.graph.facts.some(
      (fact) =>
        fact.key ===
          "recipientCount" &&
        fact.value === 2,
    ),
    true,
  );
});
