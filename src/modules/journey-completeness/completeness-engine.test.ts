import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../journey-discovery/index.js";
import { applyCompleteness, JourneyCompletenessEngine } from "./index.js";

const extractor = new DiscoveryExtractor();

function discover(message: string): JourneyProject {
  const initial = JourneyProject.create({ type: "GIFT" });
  return applyDiscovery(initial, extractor.extract({ message }));
}

test("detecta campos obligatorios pendientes en un regalo vacío", () => {
  const journey = JourneyProject.create({ type: "GIFT" }).transition("DISCOVERING");
  const report = new JourneyCompletenessEngine().evaluate(
    journey.snapshot(),
    "gift.discovery",
    "2026-08-02T00:00:00.000Z",
  );

  assert.equal(report.requiredComplete, false);
  assert.deepEqual(report.missingRequired, [
    "recipient.count",
    "recipient.relationship",
    "occasion.type",
  ]);
  assert.equal(report.readyForInspiration, false);
});

test("calcula completitud ponderada con hechos y participantes", () => {
  const discovered = discover(
    "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros",
  );
  const report = new JourneyCompletenessEngine().evaluate(discovered.snapshot());

  assert.equal(report.requiredComplete, true);
  assert.equal(report.score, 90);
  assert.equal(report.readyForInspiration, true);
  assert.deepEqual(report.missingRecommended, ["recipient.interests"]);
});

test("aplica el informe y avanza a READY_FOR_INSPIRATION", () => {
  const discovered = discover(
    "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Presupuesto de 60 euros",
  );
  const result = applyCompleteness(
    discovered,
    undefined,
    undefined,
    "2026-08-02T00:00:00.000Z",
  );

  assert.equal(result.report.readyForInspiration, true);
  assert.equal(result.journey.status, "READY_FOR_INSPIRATION");
  assert.equal(
    result.journey
      .snapshot()
      .facts.some((fact) => fact.key === "journey.completeness"),
    true,
  );
});

test("no avanza si falta una condición obligatoria", () => {
  const discovered = discover("Quiero un regalo para mi madre");
  const result = applyCompleteness(discovered);

  assert.equal(result.report.requiredComplete, false);
  assert.equal(result.journey.status, "DISCOVERING");
  assert.deepEqual(result.report.missingRequired, ["occasion.type"]);
});

test("rechaza perfiles incompatibles con el tipo de journey", () => {
  const journey = JourneyProject.create({ type: "EVENT" });
  assert.throws(
    () => new JourneyCompletenessEngine().evaluate(journey.snapshot()),
    /no admite journeys de tipo EVENT/,
  );
});
