import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { SavedIdeasService } from "./saved-ideas.service.js";

const owner = { id: "guest:test", source: "GUEST" as const, externalId: "test" };

test("guarda una idea por Journey y permite iniciar un regalo nuevo", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "saved-ideas-"));
  try {
    const service = new SavedIdeasService(path.join(dir, "saved.json"));
    const saved = await service.addItem(owner, { journeyId: "journey-1", collectionTitle: "Boda de Ana", type: "PRODUCT", productId: "p1", snapshot: { title: "Taza personalizada", priceEstimate: 15, currency: "EUR" } });
    assert.equal(saved.created, true);
    assert.equal((await service.list(owner))[0]?.items.length, 1);
    const seed = await service.startJourney(owner, saved.collection.id);
    assert.match(seed.seedMessage, /Taza personalizada/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
