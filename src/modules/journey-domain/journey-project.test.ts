import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryJourneyProjectRepository, JourneyInvariantError, JourneyProject } from "./index.js";

test("crea un JourneyProject inmutable y versionado", () => {
  const created = JourneyProject.create({ id: "journey-1", type: "GIFT", now: "2026-08-02T00:00:00.000Z" });
  const changed = created.addParticipant({ id: "recipient-1", role: "RECIPIENT", age: 7, now: "2026-08-02T00:01:00.000Z" });

  assert.equal(created.version, 1);
  assert.equal(created.snapshot().participants.length, 0);
  assert.equal(changed.version, 2);
  assert.equal(changed.snapshot().participants[0]?.age, 7);
  assert.equal(Object.isFrozen(changed.snapshot()), true);
});

test("mantiene un único hecho por clave y participante", () => {
  const base = JourneyProject.create({ id: "journey-2", type: "GIFT" })
    .addParticipant({ id: "recipient-1", role: "RECIPIENT" });
  const first = base.setFact({ key: "recipient.age", value: 7, source: "CONVERSATION", participantId: "recipient-1", now: "2026-08-02T00:00:00.000Z" });
  const updated = first.setFact({ key: "recipient.age", value: 8, confidence: 0.9, source: "USER", participantId: "recipient-1", now: "2026-08-02T00:10:00.000Z" });

  assert.equal(updated.snapshot().facts.length, 1);
  assert.equal(updated.snapshot().facts[0]?.value, 8);
  assert.equal(updated.snapshot().facts[0]?.createdAt, "2026-08-02T00:00:00.000Z");
  assert.equal(updated.snapshot().facts[0]?.updatedAt, "2026-08-02T00:10:00.000Z");
});

test("versiona artefactos por tipo", () => {
  const project = JourneyProject.create({ id: "journey-3", type: "GIFT" })
    .addArtifact({ id: "story-1", type: "STORY", title: "Primera historia" })
    .addArtifact({ id: "story-2", type: "STORY", title: "Segunda historia" })
    .addArtifact({ id: "image-1", type: "IMAGE" });

  assert.deepEqual(project.snapshot().artifacts.map((item) => [item.type, item.version]), [
    ["STORY", 1],
    ["STORY", 2],
    ["IMAGE", 1],
  ]);
});

test("protege las transiciones y los estados terminales", () => {
  const draft = JourneyProject.create({ id: "journey-4", type: "GIFT" });
  assert.throws(() => draft.transition("PROPOSING"), JourneyInvariantError);

  const completed = draft
    .transition("DISCOVERING")
    .transition("READY_FOR_INSPIRATION")
    .transition("INSPIRING")
    .transition("PROPOSING")
    .transition("AWAITING_APPROVAL")
    .transition("READY_FOR_COMMERCE")
    .transition("ORDERED")
    .transition("COMPLETED");

  assert.throws(() => completed.addParticipant({ role: "RECIPIENT" }), JourneyInvariantError);
  assert.equal(completed.transition("ARCHIVED").status, "ARCHIVED");
});

test("el repositorio rechaza escrituras con versiones obsoletas", async () => {
  const repository = new InMemoryJourneyProjectRepository();
  const original = JourneyProject.create({ id: "journey-5", type: "GIFT" });
  await repository.save(original);
  const current = original.addParticipant({ id: "recipient", role: "RECIPIENT" });
  await repository.save(current);

  await assert.rejects(() => repository.save(original), /Versión obsoleta/);
  assert.equal((await repository.getById("journey-5")).version, 2);
});
