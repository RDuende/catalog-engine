import assert from "node:assert/strict";
import test from "node:test";

import {
  MemoryBrainService,
} from "./memory-brain.service.js";
import {
  InMemoryMemoryStore,
} from "./memory-store.js";

function service() {
  return new MemoryBrainService(
    new InMemoryMemoryStore(),
  );
}

test("acumula contexto entre mensajes", async () => {
  const memory = service();

  await memory.ingestMessage(
    "journey-1",
    "owner-1",
    {
      id: "m1",
      text: "Es para mis padres.",
    },
  );

  await memory.ingestMessage(
    "journey-1",
    "owner-1",
    {
      id: "m2",
      text:
        "Les encanta cocinar.",
    },
  );

  const current =
    await memory.getOrCreate(
      "journey-1",
      "owner-1",
    );

  const snapshot =
    memory.snapshot(current);

  assert.deepEqual(
    snapshot.profile.relationships,
    ["parents"],
  );
  assert.equal(
    snapshot.profile.recipientCount,
    2,
  );
  assert.deepEqual(
    snapshot.profile.interests,
    ["cooking"],
  );
});

test("actualiza un dato único y conserva historial", async () => {
  const memory = service();

  await memory.ingestMessage(
    "journey-2",
    "owner-1",
    {
      id: "m1",
      text:
        "Tiene 7 años.",
    },
  );

  await memory.ingestMessage(
    "journey-2",
    "owner-1",
    {
      id: "m2",
      text:
        "Perdón, tiene 8 años.",
    },
  );

  const current =
    await memory.getOrCreate(
      "journey-2",
      "owner-1",
    );

  const snapshot =
    memory.snapshot(current);

  assert.deepEqual(
    snapshot.profile.ages,
    [8],
  );
  assert.equal(
    current.facts.some(
      (fact) =>
        fact.key === "age" &&
        fact.value === 7 &&
        fact.status ===
          "SUPERSEDED",
    ),
    true,
  );
});

test("no duplica preguntas ya formuladas", async () => {
  const memory = service();
  const current =
    await memory.getOrCreate(
      "journey-3",
      "owner-1",
    );
  const question =
    memory.snapshot(current)
      .discovery.nextQuestion;

  assert.ok(question);

  await memory.askQuestion(
    "journey-3",
    "owner-1",
    question,
  );
  await memory.askQuestion(
    "journey-3",
    "owner-1",
    question,
  );

  const updated =
    await memory.getOrCreate(
      "journey-3",
      "owner-1",
    );

  assert.equal(
    updated.questions.length,
    1,
  );
});

test("registra rechazos y selecciones", async () => {
  const memory = service();

  await memory.recordDecision(
    "journey-4",
    "owner-1",
    {
      type: "REJECTED",
      targetId: "mug-1",
      note:
        "No quiere tazas.",
    },
  );

  await memory.recordDecision(
    "journey-4",
    "owner-1",
    {
      type: "SELECTED",
      targetId: "wood-board-1",
    },
  );

  const current =
    await memory.getOrCreate(
      "journey-4",
      "owner-1",
    );

  assert.deepEqual(
    current.rejectedProductIds,
    ["mug-1"],
  );
  assert.deepEqual(
    current.selectedProductIds,
    ["wood-board-1"],
  );
});

test("separa memorias por propietario", async () => {
  const memory = service();

  await memory.ingestMessage(
    "journey-5",
    "owner-a",
    {
      id: "m1",
      text:
        "Tengo 60 euros.",
    },
  );

  const other =
    await memory.getOrCreate(
      "journey-5",
      "owner-b",
    );

  assert.equal(
    memory.snapshot(other)
      .profile.budget,
    undefined,
  );
});
