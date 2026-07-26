import assert from "node:assert/strict";
import test from "node:test";
import { IntentEngine } from "./intent-engine.js";

const engine = new IntentEngine();

test("extracts recipient, budget and personalization from natural language", () => {
  const { intent, criteria } = engine.analyze("Busco un regalo para una profesora por menos de 20 €, personalizado");
  assert.equal(intent.recipient, "profesor");
  assert.equal(intent.maxPriceMinor, 2000);
  assert.equal(intent.personalization, true);
  assert.deepEqual(intent.attributes.audience, ["profesor"]);
  assert.equal(criteria.maxPriceMinor, 2000);
  assert.equal(criteria.personalization, true);
});

test("resolves synonyms and semantic attributes", () => {
  const intent = engine.parse("Algo emotivo de madera para la seño por fin de curso y grabado láser");
  assert.equal(intent.recipient, "profesor");
  assert.equal(intent.occasion, "fin de curso");
  assert.deepEqual(intent.attributes.material, ["madera"]);
  assert.deepEqual(intent.attributes.technique, ["laser"]);
  assert.deepEqual(intent.attributes.emotion, ["emotivo"]);
});

test("parses ranges, quantity and urgency", () => {
  const intent = engine.parse("Necesito 40 regalos para empleados, entre 8 y 12 euros, urgente");
  assert.equal(intent.quantity, 40);
  assert.equal(intent.minPriceMinor, 800);
  assert.equal(intent.maxPriceMinor, 1200);
  assert.equal(intent.priority, "high");
  assert.deepEqual(intent.attributes.audience, ["empresa"]);
});

test("supports explicit rejection of personalization", () => {
  const intent = engine.parse("Quiero un detalle sin personalizar para una boda");
  assert.equal(intent.personalization, false);
  assert.equal(intent.occasion, "boda");
});

test("normalizes inverted price ranges and reports a warning", () => {
  const intent = engine.parse("Algo de 30 a 10 euros");
  assert.equal(intent.minPriceMinor, 1000);
  assert.equal(intent.maxPriceMinor, 3000);
  assert.equal(intent.warnings.length, 1);
});
