import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../journey-discovery/index.js";
import { applyCompleteness } from "../journey-completeness/index.js";
import { applyCreativeBrief } from "../creative-brief/index.js";
import { applyStoryConcepts } from "../story-engine/index.js";
import { applyImageBriefs, ImageBriefBuilder } from "./index.js";

async function canonicalCase() {
  const initial = JourneyProject.create({ type: "GIFT", id: "journey-gemelas" });
  const extraction = new DiscoveryExtractor().extract({
    message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros",
  });
  const discovered = applyDiscovery(initial, extraction).setFact({
    key: "recipient.interests",
    value: ["superheroínas"],
    source: "CONVERSATION",
    confidence: 1,
  });
  const complete = applyCompleteness(discovered).journey;
  const brief = applyCreativeBrief(complete, undefined, "2026-08-02T11:00:00.000Z");
  const stories = await applyStoryConcepts(brief.journey, brief.brief, undefined, "2026-08-02T11:01:00.000Z");
  return { brief, stories };
}

test("crea un ImageBrief por cada StoryConcept", async () => {
  const { brief, stories } = await canonicalCase();
  const set = new ImageBriefBuilder().build({
    creativeBrief: brief.brief,
    storySet: stories.storySet,
    now: "2026-08-02T11:02:00.000Z",
  });

  assert.equal(set.briefs.length, 3);
  assert.equal(set.briefs.every((item) => item.status === "READY"), true);
  assert.equal(set.briefs.every((item) => item.visualStyle === "COMIC"), true);
  assert.equal(set.briefs.every((item) => item.textPolicy === "NO_TEXT"), true);
  assert.equal(set.briefs[0]?.requiredElements.includes("vínculo visible entre protagonistas"), true);
});

test("mantiene trazabilidad completa con brief e historia", async () => {
  const { brief, stories } = await canonicalCase();
  const set = new ImageBriefBuilder().build({ creativeBrief: brief.brief, storySet: stories.storySet });
  assert.equal(set.creativeBriefId, brief.brief.id);
  assert.equal(set.storySetId, stories.storySet.id);
  assert.deepEqual(
    set.briefs.map((item) => item.storyConceptId),
    stories.storySet.concepts.map((item) => item.id),
  );
});

test("rechaza historias procedentes de otro CreativeBrief", async () => {
  const { brief, stories } = await canonicalCase();
  const incompatible = { ...stories.storySet, briefId: "otro-brief" };
  assert.throws(
    () => new ImageBriefBuilder().build({ creativeBrief: brief.brief, storySet: incompatible }),
    /no comparten la misma versión/,
  );
});

test("guarda el conjunto como artefacto IMAGE versionado", async () => {
  const { brief, stories } = await canonicalCase();
  const first = applyImageBriefs(stories.journey, brief.brief, stories.storySet, undefined, "2026-08-02T11:02:00.000Z");
  const second = applyImageBriefs(first.journey, brief.brief, stories.storySet, undefined, "2026-08-02T11:03:00.000Z");
  const artifacts = second.journey.snapshot().artifacts.filter((item) => item.type === "IMAGE");
  assert.deepEqual(artifacts.map((item) => item.version), [1, 2]);
  assert.equal(second.imageBriefSet.version, 2);
});
