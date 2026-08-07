import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../journey-discovery/index.js";
import { applyCompleteness } from "../journey-completeness/index.js";
import { applyCreativeBrief } from "../creative-brief/index.js";
import { applyStoryConcepts, StoryEngine } from "./index.js";

function canonicalJourney() {
  const initial = JourneyProject.create({ type: "GIFT", id: "journey-gemelas" });
  const discovery = new DiscoveryExtractor().extract({
    message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros",
  });
  const discovered = applyDiscovery(initial, discovery).setFact({
    key: "recipient.interests",
    value: ["superheroínas"],
    source: "CONVERSATION",
    confidence: 1,
  });
  return applyCompleteness(discovered).journey;
}

test("genera tres conceptos narrativos distintos desde el CreativeBrief", async () => {
  const briefResult = applyCreativeBrief(canonicalJourney(), undefined, "2026-08-02T10:00:00.000Z");
  const set = await new StoryEngine().generate(briefResult.brief, { now: "2026-08-02T10:01:00.000Z" });

  assert.equal(set.concepts.length, 3);
  assert.equal(new Set(set.concepts.map((item) => item.title)).size, 3);
  assert.equal(set.concepts.every((item) => item.status === "READY"), true);
  assert.equal(set.concepts.every((item) => item.themes.includes("superheroínas")), true);
  assert.equal(set.concepts[0]?.title, "El poder que solo existe juntas");
});

test("cada concepto conserva trazabilidad con el brief", async () => {
  const briefResult = applyCreativeBrief(canonicalJourney());
  const set = await new StoryEngine().generate(briefResult.brief);

  assert.equal(set.briefId, briefResult.brief.id);
  assert.equal(set.briefVersion, briefResult.brief.version);
  assert.equal(set.concepts.every((item) => item.briefId === briefResult.brief.id), true);
  assert.equal(set.concepts.every((item) => item.generatorId === "deterministic-story-concepts"), true);
});

test("rechaza briefs incompletos", async () => {
  const invalid = applyCreativeBrief(JourneyProject.create({ type: "GIFT" })).brief;
  await assert.rejects(() => new StoryEngine().generate(invalid), /CreativeBrief válido y READY/);
});

test("guarda los conceptos como artefacto STORY versionado", async () => {
  const briefResult = applyCreativeBrief(canonicalJourney(), undefined, "2026-08-02T10:00:00.000Z");
  const first = await applyStoryConcepts(briefResult.journey, briefResult.brief, undefined, "2026-08-02T10:01:00.000Z");
  const second = await applyStoryConcepts(first.journey, briefResult.brief, undefined, "2026-08-02T10:02:00.000Z");

  const artifacts = second.journey.snapshot().artifacts.filter((item) => item.type === "STORY");
  assert.equal(second.journey.status, "INSPIRING");
  assert.deepEqual(artifacts.map((item) => item.version), [1, 2]);
  assert.equal(second.storySet.version, 2);
});
