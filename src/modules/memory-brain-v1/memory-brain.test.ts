import assert from "node:assert/strict";
import test from "node:test";

import {
  MemoryBrainService,
} from "./memory-brain.service.js";
import type {
  MemoryRecord,
} from "./memory-brain.types.js";
import type {
  MemoryStore,
} from "./memory-store.js";

class MemoryStoreMock
implements MemoryStore {
  records:
    MemoryRecord[] = [];

  async list():
    Promise<readonly MemoryRecord[]> {
    return this.records;
  }

  async save(
    records:
      readonly MemoryRecord[],
  ): Promise<void> {
    this.records =
      [...records];
  }
}

test("aprende y recupera intereses del destinatario", async () => {
  const store =
    new MemoryStoreMock();

  const brain =
    new MemoryBrainService(
      store,
    );

  await brain.learnConversation({
    conversationId:
      "c1",
    recipientLabel:
      "mi padre",
    interests: [
      "motocross",
      "madera",
    ],
    budget: 70,
  });

  const snapshot =
    await brain.snapshot(
      "recipient:mi padre",
    );

  assert.deepEqual(
    snapshot.summary.interests,
    [
      "motocross",
      "madera",
    ],
  );

  assert.equal(
    snapshot.summary
      .averageBudget,
    70,
  );
});

test("una corrección explícita sustituye el recuerdo anterior", async () => {
  const store =
    new MemoryStoreMock();

  const brain =
    new MemoryBrainService(
      store,
    );

  const previous =
    await brain.learn({
      subjectKey:
        "recipient:ana",
      kind: "FACT",
      key: "favoriteColor",
      value: "rojo",
      confidence: 0.8,
      source:
        "INFERENCE",
    });

  const current =
    await brain.learn({
      subjectKey:
        "recipient:ana",
      kind: "FACT",
      key: "favoriteColor",
      value: "verde",
      confidence: 0.95,
      source:
        "CORRECTION",
    });

  assert.equal(
    current.record.value,
    "verde",
  );

  assert.equal(
    current.record
      .supersedes,
    previous.record.id,
  );

  assert.equal(
    current.conflict
      ?.resolution,
    "USE_INCOMING",
  );
});

test("los intereses se fusionan sin duplicados", async () => {
  const store =
    new MemoryStoreMock();

  const brain =
    new MemoryBrainService(
      store,
    );

  await brain.learn({
    subjectKey:
      "recipient:padre",
    kind: "INTEREST",
    key: "interests",
    value: [
      "motocross",
    ],
    confidence: 0.9,
  });

  const result =
    await brain.learn({
      subjectKey:
        "recipient:padre",
    kind: "INTEREST",
    key: "interests",
    value: [
      "motocross",
      "madera",
    ],
    confidence: 0.9,
  });

  assert.deepEqual(
    result.record.value,
    [
      "motocross",
      "madera",
    ],
  );
});

test("recuerda regalos anteriores", async () => {
  const store =
    new MemoryStoreMock();

  const brain =
    new MemoryBrainService(
      store,
    );

  await brain.rememberGift({
    subjectKey:
      "recipient:mi padre",
    orderId:
      "ORD-1",
    products: [
      {
        productId: "p1",
        name: "Taza",
      },
    ],
    total: 20,
  });

  const snapshot =
    await brain.snapshot(
      "recipient:mi padre",
    );

  assert.equal(
    snapshot.summary
      .giftCount,
    1,
  );
});
