import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { ConversationResponseBuilder } from "./conversation-response-builder.js";

function result(status: "NEEDS_INPUT" | "READY_FOR_PROPOSALS", nextQuestion?: string) {
  return {
    status,
    journey: JourneyProject.create({ type: "GIFT", now: "2026-08-03T00:00:00.000Z" }).snapshot(),
    discovery: { extractorVersion: "test", participants: [], facts: [], evidence: [], confidence: 1 },
    completeness: { profileId: "test", profileVersion: "1", score: 0, requiredScore: 0, recommendedScore: 0, requiredComplete: status !== "NEEDS_INPUT", readyForInspiration: status !== "NEEDS_INPUT", satisfiedKeys: [], missingRequired: [], missingRecommended: [], requirements: [], evaluatedAt: "2026-08-03T00:00:00.000Z" },
    missingRequired: nextQuestion ? ["budget.max"] : [],
    nextQuestion,
    timing: { totalMs: 1, discoveryMs: 1, completenessMs: 1 },
  } as const;
}

test("resume hechos nuevos y conserva una sola pregunta", () => {
  const previous = JourneyProject.create({ type: "GIFT", now: "2026-08-03T00:00:00.000Z" });
  const current = previous
    .setFact({ key: "recipient.age", value: 12, confidence: 1, source: "CONVERSATION", now: "2026-08-03T00:01:00.000Z" })
    .setFact({ key: "recipient.interests", value: ["rap"], confidence: 1, source: "CONVERSATION", now: "2026-08-03T00:01:01.000Z" });
  const response = new ConversationResponseBuilder().build({
    previousJourney: previous.snapshot(),
    journey: current.snapshot(),
    engineResult: result("NEEDS_INPUT", "¿Qué presupuesto tienes pensado?"),
  });
  assert.match(response.text, /12 años/);
  assert.match(response.text, /rap/);
  assert.equal((response.text.match(/¿/g) ?? []).length, 1);
  assert.match(response.text, /¿Qué presupuesto tienes pensado\?/);
});

test("indica que ya puede mostrar propuestas", () => {
  const journey = JourneyProject.create({ type: "GIFT", now: "2026-08-03T00:00:00.000Z" });
  const response = new ConversationResponseBuilder().build({
    journey: journey.snapshot(),
    engineResult: result("READY_FOR_PROPOSALS"),
  });
  assert.equal(response.progress.readyForProposals, true);
  assert.match(response.text, /Mostrar propuestas/);
});
