import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject, type JourneyProjectSnapshot } from "../journey-domain/index.js";
import { applyCompleteness } from "../journey-completeness/index.js";
import { pendingRequiredFact, resolveContextualAnswer } from "./contextual-answer-resolver.js";

const NOW = "2026-08-02T09:00:00.000Z";

function waitingForCount(): JourneyProjectSnapshot {
  let journey = JourneyProject.create({ type: "GIFT", now: NOW }).transition("DISCOVERING");
  journey = applyCompleteness(journey, undefined, "gift.discovery", "2026-08-02T09:00:01.000Z").journey;
  return journey.snapshot();
}

function snapshotWithPending(key: string): JourneyProjectSnapshot {
  let journey = JourneyProject.create({ type: "GIFT", now: NOW }).transition("DISCOVERING");
  journey = journey.setFact({
    key: "conversation.pending_fact",
    value: key,
    confidence: 1,
    source: "SYSTEM",
    now: "2026-08-02T09:00:01.000Z",
  });
  return journey.snapshot();
}

test("usa la completitud persistida para conocer la pregunta pendiente", () => {
  assert.equal(pendingRequiredFact(waitingForCount()), "recipient.count");
});

test("interpreta una respuesta numérica corta según la pregunta pendiente", () => {
  const facts = resolveContextualAnswer(waitingForCount(), "2", "2026-08-02T09:01:00.000Z");
  assert.equal(facts.find((fact) => fact.key === "recipient.count")?.value, 2);
});

test("interpreta mis padres como dos destinatarios y relación parental", () => {
  const facts = resolveContextualAnswer(waitingForCount(), "para mis padres");
  assert.equal(facts.find((fact) => fact.key === "recipient.count")?.value, 2);
  assert.equal(facts.find((fact) => fact.key === "recipient.relationship")?.value, "parent");
});

test("reconoce genérica en femenino como alcance generic", () => {
  const snapshot = snapshotWithPending("gift.scope");
  const facts = resolveContextualAnswer(snapshot, "Una idea genérica");
  assert.equal(facts.find((fact) => fact.key === "gift.scope")?.value, "generic");
});

test("mi hermana fija alcance personal, relación y cantidad", () => {
  const snapshot = snapshotWithPending("gift.scope");
  const facts = resolveContextualAnswer(snapshot, "mi hermana");

  assert.equal(facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(facts.find((fact) => fact.key === "recipient.relationship")?.value, "sibling");
  assert.equal(facts.find((fact) => fact.key === "recipient.count")?.value, 1);
});

test("conserva una ocasión inequívoca aunque otra respuesta esté pendiente", () => {
  const snapshot = snapshotWithPending("gift.scope");
  const facts = resolveContextualAnswer(snapshot, "boda");

  assert.equal(facts.find((fact) => fact.key === "occasion.type")?.value, "wedding");
});

test("no pierde el alcance personal al responder después la ocasión", () => {
  let journey = JourneyProject.restore(snapshotWithPending("gift.scope"));

  for (const fact of resolveContextualAnswer(journey.snapshot(), "mi hermana", "2026-08-02T09:01:00.000Z")) {
    journey = journey.setFact(fact);
  }

  journey = journey.setFact({
    key: "conversation.pending_fact",
    value: "occasion.type",
    confidence: 1,
    source: "SYSTEM",
    now: "2026-08-02T09:02:00.000Z",
  });

  for (const fact of resolveContextualAnswer(journey.snapshot(), "boda", "2026-08-02T09:03:00.000Z")) {
    journey = journey.setFact(fact);
  }

  const facts = journey.snapshot().facts;
  assert.equal(facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(facts.find((fact) => fact.key === "recipient.relationship")?.value, "sibling");
  assert.equal(facts.find((fact) => fact.key === "recipient.count")?.value, 1);
  assert.equal(facts.find((fact) => fact.key === "occasion.type")?.value, "wedding");
});

test("mis amigos fija alcance personal sin inventar cantidad", () => {
  const snapshot = snapshotWithPending("gift.scope");
  const facts = resolveContextualAnswer(snapshot, "mis amigos");

  assert.equal(facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(facts.find((fact) => fact.key === "recipient.relationship")?.value, "friend");
  assert.equal(facts.find((fact) => fact.key === "recipient.count"), undefined);
});

test("mis compañeros fija alcance personal sin inventar cantidad", () => {
  const snapshot = snapshotWithPending("gift.scope");
  const facts = resolveContextualAnswer(snapshot, "mis compañeros");

  assert.equal(facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(facts.find((fact) => fact.key === "recipient.relationship")?.value, "coworker");
  assert.equal(facts.find((fact) => fact.key === "recipient.count"), undefined);
});

test("un posesivo no destinatario no fija alcance personal", () => {
  const snapshot = snapshotWithPending("gift.scope");
  const facts = resolveContextualAnswer(snapshot, "mi presupuesto es de 50 euros");

  assert.equal(facts.find((fact) => fact.key === "gift.scope"), undefined);
});
