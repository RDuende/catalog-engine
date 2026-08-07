import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  JsonFileMemoryStore,
  MemoryBrainService,
} from "../memory-brain/index.js";
import {
  mergeGiftProfileWithMemory,
} from "./journey-memory.mapper.js";
import {
  JourneyMemoryService,
} from "./journey-memory.service.js";

test("persiste mensajes y recupera el Journey", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "journey-memory-"),
  );
  const file =
    join(directory, "memory.json");

  try {
    const first =
      new JourneyMemoryService(
        new MemoryBrainService(
          new JsonFileMemoryStore(file),
        ),
      );

    await first.ingestMessage({
      journeyId: "journey-1",
      ownerId: "owner-1",
      messageId: "message-1",
      text: "Es para mis padres.",
    });

    await first.ingestMessage({
      journeyId: "journey-1",
      ownerId: "owner-1",
      messageId: "message-2",
      text:
        "Les encanta cocinar y tengo 60 euros.",
    });

    const second =
      new JourneyMemoryService(
        new MemoryBrainService(
          new JsonFileMemoryStore(file),
        ),
      );

    const state =
      await second.getState(
        "journey-1",
        "owner-1",
      );

    assert.equal(
      state.snapshot.profile
        .recipientCount,
      2,
    );
    assert.deepEqual(
      state.snapshot.profile
        .interests,
      ["cooking"],
    );
    assert.equal(
      state.snapshot.profile.budget,
      60,
    );
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    });
  }
});

test("fusiona la memoria con Gift Profile", async () => {
  const service =
    new JourneyMemoryService(
      new MemoryBrainService(),
    );

  await service.ingestMessage({
    journeyId: "journey-2",
    ownerId: "owner-1",
    messageId: "message-1",
    text:
      "Es para mi padre y le gusta cocinar.",
  });

  const state =
    await service.getState(
      "journey-2",
      "owner-1",
    );

  const merged =
    mergeGiftProfileWithMemory(
      {
        occasion: "birthday",
      },
      state.snapshot,
    );

  assert.equal(
    merged.occasion,
    "birthday",
  );
  assert.deepEqual(
    merged.relationships,
    ["father"],
  );
  assert.deepEqual(
    merged.interests,
    ["cooking"],
  );
});

test("no repite la siguiente pregunta", async () => {
  const service =
    new JourneyMemoryService(
      new MemoryBrainService(),
    );

  const first =
    await service.getState(
      "journey-3",
      "owner-1",
    );

  const question =
    first.snapshot.discovery
      .nextQuestion;

  assert.ok(question);

  await service.askQuestion({
    journeyId: "journey-3",
    ownerId: "owner-1",
    question,
  });

  const second =
    await service.getState(
      "journey-3",
      "owner-1",
    );

  assert.notEqual(
    second.snapshot.discovery
      .nextQuestion?.key,
    question.key,
  );
});

test("registra decisiones de producto", async () => {
  const service =
    new JourneyMemoryService(
      new MemoryBrainService(),
    );

  const state =
    await service.recordDecision({
      journeyId: "journey-4",
      ownerId: "owner-1",
      decision: {
        type: "REJECTED",
        targetId: "mug-1",
      },
    });

  assert.deepEqual(
    state.memory.rejectedProductIds,
    ["mug-1"],
  );
});
