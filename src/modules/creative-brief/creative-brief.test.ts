import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../journey-discovery/index.js";
import { applyCompleteness } from "../journey-completeness/index.js";
import { applyCreativeBrief, CreativeBriefBuilder } from "./index.js";

function gemelasJourney(): JourneyProject {
  const extractor = new DiscoveryExtractor();
  const initial = JourneyProject.create({ type: "GIFT", id: "journey-gemelas" });
  const discovered = applyDiscovery(initial, extractor.extract({
    message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros",
  }));
  const themed = discovered.setFact({
    key: "recipient.interests",
    value: ["superheroínas"],
    source: "CONVERSATION",
    confidence: 1,
    evidence: "les encantan las superheroínas",
  });
  return applyCompleteness(themed).journey;
}

test("construye un CreativeBrief listo para el caso de las gemelas", () => {
  const brief = new CreativeBriefBuilder().build({
    journey: gemelasJourney().snapshot(),
    id: "brief-gemelas",
    now: "2026-08-02T09:00:00.000Z",
  });

  assert.equal(brief.status, "READY");
  assert.equal(brief.audience.length, 2);
  assert.equal(brief.audience[0]?.age, 7);
  assert.equal(brief.occasion, "birthday");
  assert.equal(brief.budget?.maximum, 60);
  assert.deepEqual(brief.themes, ["superheroínas"]);
  assert.equal(brief.narrativeStyle, "ADVENTURE");
  assert.equal(brief.visualStyle, "COMIC");
  assert.equal(brief.emotionalGoals.includes("CONNECTION"), true);
  assert.equal(brief.validation.valid, true);
});

test("mantiene trazabilidad de hechos e inferencias", () => {
  const brief = new CreativeBriefBuilder().build({ journey: gemelasJourney().snapshot() });

  assert.equal(brief.sources.some((source) => source.factKey === "occasion.type"), true);
  assert.equal(brief.sources.some((source) => source.factKey === "budget.max"), true);
  assert.equal(brief.sources.some((source) => source.source === "RULE"), true);
});

test("detecta datos pendientes sin inventarlos", () => {
  const journey = JourneyProject.create({ type: "GIFT" }).transition("DISCOVERING");
  const brief = new CreativeBriefBuilder().build({ journey: journey.snapshot() });

  assert.equal(brief.status, "INVALID");
  assert.equal(brief.pendingFacts.includes("recipient.count"), true);
  assert.equal(brief.pendingFacts.includes("occasion.type"), true);
  assert.equal(brief.validation.issues.some((issue) => issue.code === "AUDIENCE_REQUIRED"), true);
});

test("guarda el brief como artefacto versionado del Journey", () => {
  const first = applyCreativeBrief(gemelasJourney(), undefined, "2026-08-02T09:00:00.000Z");
  const second = applyCreativeBrief(first.journey, undefined, "2026-08-02T09:05:00.000Z", { force: true });

  const artifacts = second.journey.snapshot().artifacts.filter((artifact) => artifact.type === "CREATIVE_BRIEF");
  assert.equal(artifacts.length, 2);
  assert.deepEqual(artifacts.map((artifact) => artifact.version), [1, 2]);
  assert.equal(second.brief.version, 2);
});

test("construye el brief READY desde facts aunque no existan participantes explícitos", () => {
  let journey = JourneyProject.create({ type: "GIFT", id: "journey-angelillo" });
  const facts = [
    ["gift.scope", "personal"], ["recipient.count", 1], ["recipient.relationship", "hijo de un amigo"],
    ["recipient.age", 12], ["recipient.name", "Angelillo"], ["recipient.interests", ["música", "rap"]],
    ["occasion.type", "communion"], ["budget.max", 25], ["gift.style", ["divertido"]],
    ["personalization.enabled", true], ["personalization.name", "Angelillo"],
    ["personalization.photo_available", false], ["delivery.date_text", "octubre"],
  ] as const;
  for (const [key, value] of facts) journey = journey.setFact({ key, value, source: "CONVERSATION", confidence: 1 });

  const brief = new CreativeBriefBuilder().build({ journey: journey.snapshot(), now: "2026-08-03T00:00:00.000Z" });
  assert.equal(brief.status, "READY");
  assert.equal(brief.qualityGate.passed, true);
  assert.equal(brief.audience[0]?.name, "Angelillo");
  assert.equal(brief.audience[0]?.age, 12);
  assert.deepEqual(brief.themes, ["música", "rap"]);
  assert.equal(brief.budget?.maximum, 25);
  assert.equal(brief.personalization.includePhoto, false);
  assert.equal(brief.narrativeStyle, "HUMOROUS");
  assert.equal(brief.occasionDateText, "octubre");
});

test("reutiliza el brief si los hechos creativos no cambian", () => {
  const first = applyCreativeBrief(gemelasJourney(), undefined, "2026-08-03T00:00:00.000Z");
  const second = applyCreativeBrief(first.journey, undefined, "2026-08-03T00:01:00.000Z");
  assert.equal(second.reused, true);
  assert.equal(second.brief.id, first.brief.id);
  assert.equal(second.journey.snapshot().artifacts.filter((a) => a.type === "CREATIVE_BRIEF").length, 1);
});

test("crea nueva versión cuando cambia un hecho relevante", () => {
  const first = applyCreativeBrief(gemelasJourney(), undefined, "2026-08-03T00:00:00.000Z");
  const changed = first.journey.setFact({ key: "budget.max", value: 75, source: "CONVERSATION", confidence: 1 });
  const second = applyCreativeBrief(changed, undefined, "2026-08-03T00:02:00.000Z");
  assert.equal(second.reused, false);
  assert.equal(second.brief.version, 2);
  assert.notEqual(second.brief.fingerprint, first.brief.fingerprint);
});
