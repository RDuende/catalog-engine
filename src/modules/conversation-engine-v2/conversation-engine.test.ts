import assert from "node:assert/strict";
import test from "node:test";

import {
  ConversationEngineV2Service,
} from "./conversation-engine.service.js";

test("pregunta por el dato requerido de mayor prioridad", async () => {
  const result =
    await new ConversationEngineV2Service()
      .process({
        facts: {
          recipientLabel:
            "mi padre",
        },
      });

  assert.equal(
    result.decision.action,
    "ASK",
  );

  assert.equal(
    result.decision.question
      ?.key,
    "interests",
  );
});

test("detecta contradicción entre presupuesto y cantidad", async () => {
  const result =
    await new ConversationEngineV2Service()
      .process({
        facts: {
          recipientLabel:
            "mi padre",
          occasion:
            "cumpleaños",
          budget: 30,
          interests: [
            "motocross",
          ],
          giftCount: 5,
        },
      });

  assert.equal(
    result.decision.action,
    "RESOLVE_CONTRADICTION",
  );

  assert.equal(
    result.graph
      .contradictions.length,
    1,
  );
});

test("mantiene Conversation Graph entre turnos", async () => {
  const engine =
    new ConversationEngineV2Service();

  const first =
    await engine.process({
      conversationId:
        "test-graph",
      message:
        "Es para mi padre",
      facts: {
        recipientLabel:
          "mi padre",
      },
    });

  const second =
    await engine.process({
      graph:
        first.graph,
      message:
        "Es por su cumpleaños",
      facts: {
        occasion:
          "cumpleaños",
      },
    });

  assert.equal(
    second.graph.nodes.length >
      first.graph.nodes.length,
    true,
  );

  assert.equal(
    second.graph.facts.some(
      (fact) =>
        fact.key ===
          "recipientLabel",
    ),
    true,
  );

  assert.equal(
    second.graph.facts.some(
      (fact) =>
        fact.key ===
          "occasion",
    ),
    true,
  );
});
