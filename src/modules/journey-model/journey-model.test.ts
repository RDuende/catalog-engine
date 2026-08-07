import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { buildGiftModel, decideJourney } from "./index.js";

test("construye un GiftModel consistente desde los hechos del Journey", () => {
  let journey = JourneyProject.create({ type: "GIFT", now: "2026-08-03T00:00:00.000Z" });
  journey = journey.setFact({ key: "recipient.relationship", value: "friend_child", confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "occasion.type", value: "communion", confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "recipient.age", value: 12, confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "recipient.interests", value: ["music", "rap"], confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "budget.max", value: 25, confidence: 1, source: "CONVERSATION" });
  const model = buildGiftModel(journey.snapshot());
  assert.equal(model.recipient.age, 12);
  assert.deepEqual(model.recipient.interests, ["music", "rap"]);
  assert.equal(model.budget.max, 25);
  assert.equal(model.quality.requiredComplete, true);
  assert.equal(decideJourney(journey.snapshot()).state, "READY_FOR_PROPOSALS");
});

test("mantiene historial al corregir un hecho y fusiona intereses", () => {
  let journey = JourneyProject.create({ type: "GIFT" });
  journey = journey.setFact({ key: "recipient.age", value: 12, confidence: 1, source: "CONVERSATION", evidence: "12 años" });
  journey = journey.setFact({ key: "recipient.age", value: 13, confidence: 1, source: "CONVERSATION", evidence: "perdón, 13" });
  journey = journey.setFact({ key: "recipient.interests", value: ["music"], confidence: 0.9, source: "CONVERSATION" });
  journey = journey.setFact({ key: "recipient.interests", value: ["rap"], confidence: 0.9, source: "CONVERSATION" });
  const age = journey.snapshot().facts.find((fact) => fact.key === "recipient.age");
  assert.equal(age?.value, 13);
  assert.equal(age?.status, "UPDATED");
  assert.equal(age?.history?.length, 1);
  assert.deepEqual(buildGiftModel(journey.snapshot()).recipient.interests, ["music", "rap"]);
});
