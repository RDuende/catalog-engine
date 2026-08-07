import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { buildGiftModel, decideJourney, normalizeFactConfidence } from "./index.js";

function baseJourney(): JourneyProject {
  let journey = JourneyProject.create({ type: "GIFT", now: "2026-08-03T00:00:00.000Z" });
  journey = journey.setFact({ key: "recipient.relationship", value: "friend_child", confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "occasion.type", value: "communion", confidence: 1, source: "CONVERSATION" });
  return journey;
}

test("calcula calidad ponderada y readiness parcial sin esperar al 100%", () => {
  let journey = baseJourney();
  journey = journey.setFact({ key: "recipient.age", value: 12, confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "recipient.interests", value: ["music", "rap"], confidence: 0.95, source: "CONVERSATION" });
  const model = buildGiftModel(journey.snapshot());
  assert.ok(model.quality.score >= 55);
  assert.equal(model.readiness.ready, true);
  assert.equal(model.readiness.canOfferButton, true);
});

test("prioriza presupuesto cuando destinatario, ocasión e intereses ya están definidos", () => {
  let journey = baseJourney();
  journey = journey.setFact({ key: "recipient.age", value: 12, confidence: 1, source: "CONVERSATION" });
  journey = journey.setFact({ key: "recipient.interests", value: ["rap"], confidence: 1, source: "CONVERSATION" });
  const decision = decideJourney(journey.snapshot());
  assert.equal(decision.nextFact, "budget.max");
  assert.match(decision.nextQuestion ?? "", /presupuesto/i);
});

test("la confianza baja con expresiones de duda y sube con afirmaciones concretas", () => {
  assert.ok(normalizeFactConfidence({ value: 12, confidence: 0.8, evidence: "creo que tiene unos 12 años" }) < 0.8);
  assert.equal(normalizeFactConfidence({ value: 12, confidence: 0.8, evidence: "tiene exactamente 12 años" }), 0.95);
});

test("expone dimensiones para el inspector del GiftModel", () => {
  const model = buildGiftModel(baseJourney().snapshot());
  assert.deepEqual(model.quality.dimensions.map((item) => item.id), [
    "recipient", "interests", "budget", "occasion", "personalization", "delivery", "style",
  ]);
});
