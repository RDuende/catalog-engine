import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { DiscoveryExtractor, applyDiscovery } from "../journey-discovery/index.js";
import { applyCompleteness } from "../journey-completeness/index.js";
import { applyCreativeBrief } from "../creative-brief/index.js";
import { applyStoryConcepts } from "../story-engine/index.js";
import { applyImageBriefs } from "../image-brief/index.js";
import { applySolutions, SolutionEngine } from "./index.js";

async function scenario() {
  const initial = JourneyProject.create({ type: "GIFT", id: "solution-gemelas", now: "2026-08-02T08:00:00.000Z" });
  const extraction = new DiscoveryExtractor().extract({ message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es 60 euros" });
  const discovered = applyDiscovery(initial, extraction).setFact({ key: "recipient.interests", value: ["superheroínas"], source: "CONVERSATION", confidence: 1 });
  const complete = applyCompleteness(discovered).journey;
  const creative = applyCreativeBrief(complete, undefined, "2026-08-02T08:01:00.000Z");
  const stories = await applyStoryConcepts(creative.journey, creative.brief, undefined, "2026-08-02T08:02:00.000Z");
  const images = applyImageBriefs(stories.journey, creative.brief, stories.storySet, undefined, "2026-08-02T08:03:00.000Z");
  return { creative, stories, images };
}

test("genera tres soluciones explicables dentro del presupuesto", async () => {
  const { creative, stories, images } = await scenario();
  const set = new SolutionEngine().build({ creativeBrief: creative.brief, storySet: stories.storySet, imageBriefSet: images.imageBriefSet, now: "2026-08-02T08:04:00.000Z" });
  assert.equal(set.solutions.length, 3);
  assert.equal(set.solutions.every((solution) => solution.status === "READY"), true);
  assert.equal(set.solutions.every((solution) => solution.total <= 60), true);
  assert.equal(set.solutions.every((solution) => solution.products.length >= 2), true);
  assert.equal(set.solutions.every((solution) => solution.policyResults.length === 4), true);
  assert.equal(set.solutions[0]!.score >= set.solutions[1]!.score, true);
});

test("persiste el SolutionSet como propuesta y avanza el Journey", async () => {
  const { creative, stories, images } = await scenario();
  const result = applySolutions(images.journey, creative.brief, stories.storySet, images.imageBriefSet, undefined, "2026-08-02T08:04:00.000Z");
  assert.equal(result.journey.status, "PROPOSING");
  const artifact = result.journey.snapshot().artifacts.at(-1);
  assert.equal(artifact?.type, "PROPOSAL");
  assert.equal(artifact?.status, "READY");
  assert.equal(result.solutionSet.version, 1);
});

test("rechaza candidatos que exceden el presupuesto", async () => {
  const { creative, stories, images } = await scenario();
  const tinyBudget = Object.freeze({ ...creative.brief, budget: Object.freeze({ maximum: 10, currency: "EUR" }) });
  const set = new SolutionEngine().build({ creativeBrief: tinyBudget, storySet: stories.storySet, imageBriefSet: images.imageBriefSet });
  assert.equal(set.solutions.length, 0);
  assert.equal(set.rejectedCandidates, 3);
});
