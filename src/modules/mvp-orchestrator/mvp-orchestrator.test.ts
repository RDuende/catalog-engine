import assert from "node:assert/strict";
import test from "node:test";
import { MvpOrchestrator } from "./mvp-orchestrator.js";

test("ejecuta el recorrido completo de las gemelas", async () => {
  const result = await new MvpOrchestrator().run({
    journeyId: "mvp-gemelas",
    now: "2026-08-02T09:00:00.000Z",
    message: "Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es de 60 euros y les encantan las superheroínas.",
  });

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.completeness.requiredComplete, true);
  assert.equal(result.creativeBrief?.audience.length, 2);
  assert.equal(result.storySet?.concepts.length, 3);
  assert.equal(result.imageBriefSet?.briefs.length, 3);
  assert.equal(result.solutionSet?.solutions.length, 3);
  assert.equal(result.proposalSet?.proposals.length, 3);
  assert.equal(result.proposalSet?.proposals.every((proposal) => proposal.actions.some((action) => action.type === "CUSTOMIZE")), true);
  assert.equal(result.solutionSet?.solutions.every((solution) => solution.total <= 60), true);
  assert.equal(result.journey.status, "PROPOSING");
});

test("se detiene y devuelve la siguiente pregunta cuando faltan datos obligatorios", async () => {
  const result = await new MvpOrchestrator().run({
    message: "Quiero hacer un regalo",
    now: "2026-08-02T09:00:00.000Z",
  });

  assert.equal(result.status, "NEEDS_INPUT");
  assert.equal(result.solutionSet, undefined);
  assert.equal(result.missingRequired.length > 0, true);
  assert.equal(typeof result.nextQuestion, "string");
});

test("no vuelve a preguntar el alcance tras responder mi hermana y boda", async () => {
  const orchestrator = new MvpOrchestrator();

  let result = await orchestrator.run({
    journeyId: "scope-wedding-hotfix",
    now: "2026-08-02T09:00:00.000Z",
    message: "un regalo de boda",
  });

  assert.equal(result.status, "NEEDS_INPUT");
  assert.equal(
    result.nextQuestion,
    "¿Buscas una idea de regalo genérica o quieres crear algo para alguien en particular?",
  );

  result = await orchestrator.run({
    journey: result.journey,
    now: "2026-08-02T09:01:00.000Z",
    message: "mi hermana",
  });

  const personalScope = result.journey.facts.find((fact) => fact.key === "gift.scope");
  assert.equal(personalScope?.value, "personal");
  assert.equal(result.journey.facts.find((fact) => fact.key === "recipient.relationship")?.value, "sibling");
  assert.equal(result.journey.facts.find((fact) => fact.key === "recipient.count")?.value, 1);

  result = await orchestrator.run({
    journey: result.journey,
    now: "2026-08-02T09:02:00.000Z",
    message: "boda",
  });

  assert.notEqual(
    result.nextQuestion,
    "¿Buscas una idea de regalo genérica o quieres crear algo para alguien en particular?",
  );
  assert.equal(result.journey.facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(result.journey.facts.find((fact) => fact.key === "occasion.type")?.value, "wedding");
});


test("a ver no reabre el descubrimiento cuando el Journey ya está proponiendo", async () => {
  const orchestrator = new MvpOrchestrator();

  let result = await orchestrator.run({
    journeyId: "proposal-continuation-hotfix",
    now: "2026-08-02T09:00:00.000Z",
    message: "un regalo",
  });

  assert.equal(result.status, "NEEDS_INPUT");

  result = await orchestrator.run({
    journey: result.journey,
    now: "2026-08-02T09:01:00.000Z",
    message: "para la boda de mi amigo",
  });

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.journey.status, "PROPOSING");
  assert.equal(result.solutionSet?.solutions.length, 3);

  const proposingJourney = result.journey;
  result = await orchestrator.run({
    journey: proposingJourney,
    now: "2026-08-02T09:02:00.000Z",
    message: "a ver",
  });

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.journey.status, "PROPOSING");
  assert.equal(result.nextQuestion, undefined);
  assert.equal(result.missingRequired.length, 0);
  assert.equal(result.journey.facts.find((fact) => fact.key === "gift.scope")?.value, "personal");
  assert.equal(result.journey.facts.find((fact) => fact.key === "occasion.type")?.value, "wedding");
  assert.equal(result.journey.facts.find((fact) => fact.key === "recipient.relationship")?.value, "friend");
});
