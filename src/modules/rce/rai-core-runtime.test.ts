import assert from "node:assert/strict";
import test from "node:test";

import { createRaiCore } from "./rai-core-bootstrap.js";
import { RAI_CORE_VERSION } from "./rai-core.contracts.js";

test("Rai Core procesa conversación y planifica tareas", () => {
  const { core } = createRaiCore();

  const result = core.process({
    conversationId: "c1",
    messageId: "m1",
    text: "Es para mi sobrino que cumple 10 años y le encanta el fútbol",
    now: "2026-08-04T12:00:00.000Z",
  });

  assert.equal(result.version, RAI_CORE_VERSION);
  assert.equal(
    result.process.state.facts["recipient.relationship"]?.value,
    "nephew",
  );
  assert.equal(
    result.plan.tasks.some(
      (task) => task.type === "SEARCH_PRODUCTS",
    ),
    true,
  );
  assert.equal(result.tasks.tasks.length > 0, true);
});

test("Rai Core conserva estado entre mensajes", () => {
  const { core } = createRaiCore();

  core.process({
    conversationId: "c1",
    messageId: "m1",
    text: "Es para mi sobrino",
  });

  core.process({
    conversationId: "c1",
    messageId: "m2",
    text: "Le gusta el fútbol",
  });

  const state = core.getState("c1");

  assert.equal(
    state?.facts["recipient.relationship"]?.value,
    "nephew",
  );
  assert.deepEqual(
    state?.facts["recipient.interests"]?.value,
    ["football"],
  );
});

test("health expone capacidades instaladas", () => {
  const { core } = createRaiCore({
    productSearch: {
      async search() {
        return [];
      },
    },
    productRanking: {
      async rank() {
        return [];
      },
    },
  });

  const health = core.health(
    "2026-08-04T12:00:00.000Z",
  );

  assert.equal(health.status, "READY");
  assert.equal(health.capabilities.CONVERSATION, true);
  assert.equal(health.capabilities.PRODUCTS, true);
  assert.equal(health.capabilities.STORIES, false);
});

test("bootstrap registra runtimes opcionales", async () => {
  const { core } = createRaiCore({
    productSearch: {
      async search() {
        return [
          {
            id: "ball",
            title: "Balón",
            score: 90,
          },
        ];
      },
    },
    productRanking: {
      async rank({ candidates }) {
        return candidates.map((candidate, index) => ({
          ...candidate,
          rank: index + 1,
          score: candidate.score ?? 0,
          reasons: ["test"],
        }));
      },
    },
    storyGeneration: {
      async generate() {
        return [];
      },
    },
    imagePreparation: {
      async prepare() {
        return [];
      },
    },
  });

  core.process({
    conversationId: "c1",
    messageId: "m1",
    text: "Es para mi sobrino por su cumpleaños y le gusta el fútbol",
  });

  const first = await core.runNextTask("c1");

  assert.equal(
    first.tasks.some(
      (task) => task.status === "COMPLETED",
    ),
    true,
  );

  const health = core.health();

  assert.equal(health.capabilities.PRODUCTS, true);
  assert.equal(health.capabilities.STORIES, true);
  assert.equal(health.capabilities.IMAGES, true);
});

test("expone progreso listo para interfaz", () => {
  const { core } = createRaiCore();

  core.process({
    conversationId: "c1",
    messageId: "m1",
    text: "Es para mi sobrino por su cumpleaños",
  });

  const progress = core.getProgress("c1");

  assert.equal(typeof progress.percent, "number");
  assert.equal(progress.stages.length > 0, true);
});
