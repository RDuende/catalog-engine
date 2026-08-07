import assert from "node:assert/strict";
import test from "node:test";
import { RceJourneyBridge } from "./journey-bridge.js";

const bridge = new RceJourneyBridge();

test("convierte un mensaje libre en hechos aplicables al Journey", () => {
  const result = bridge.process({
    journey: {
      id: "journey-1",
      facts: [],
    },
    messageId: "message-1",
    text: "Un regalo para mi sobrino por su décimo cumpleaños, le gusta el fútbol y tengo 30 €",
    now: "2026-08-03T12:00:00.000Z",
  });

  const facts = Object.fromEntries(
    result.factsToApply.map((fact) => [fact.key, fact.value]),
  );

  assert.equal(facts["gift.scope"], "personal");
  assert.equal(facts["recipient.relationship"], "nephew");
  assert.equal(facts["recipient.count"], 1);
  assert.equal(facts["recipient.age"], 10);
  assert.equal(facts["occasion.type"], "birthday");
  assert.deepEqual(facts["recipient.interests"], ["football"]);
  assert.equal(facts["budget.max"], 30);
});

test("no degrada un hecho existente con mayor confianza", () => {
  const result = bridge.process({
    journey: {
      id: "journey-1",
      facts: [
        {
          key: "recipient.age",
          value: 11,
          confidence: 1,
          source: "CONVERSATION",
          updatedAt: "2026-08-03T11:00:00.000Z",
        },
      ],
    },
    messageId: "message-2",
    text: "Es su décimo cumpleaños",
    now: "2026-08-03T12:00:00.000Z",
  });

  assert.equal(
    result.factsToApply.some((fact) => fact.key === "recipient.age"),
    false,
  );
  assert.equal(result.skippedKeys.includes("recipient.age"), true);
});

test("permite una corrección explícita con confianza máxima", () => {
  const result = bridge.process({
    journey: {
      id: "journey-1",
      facts: [
        {
          key: "recipient.age",
          value: 12,
          confidence: 1,
          source: "CONVERSATION",
          updatedAt: "2026-08-03T11:00:00.000Z",
        },
      ],
    },
    messageId: "message-3",
    text: "Perdón, tiene 13 años",
    now: "2026-08-03T12:00:00.000Z",
  });

  const age = result.factsToApply.find(
    (fact) => fact.key === "recipient.age",
  );

  assert.equal(age?.value, 13);
  assert.equal(age?.confidence, 1);
});
