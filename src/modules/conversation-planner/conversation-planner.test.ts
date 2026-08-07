import assert from "node:assert/strict";
import test from "node:test";
import { JourneyProject } from "../journey-domain/index.js";
import { JourneyCompletenessEngine } from "../journey-completeness/index.js";
import { ConversationPlanner } from "./conversation-planner.js";

function baseJourney(): JourneyProject {
  return JourneyProject.create({ type: "GIFT", sessionId: "s-v14" }).transition("DISCOVERING");
}

test("prioriza la pregunta obligatoria con mayor valor", () => {
  const journey = baseJourney().addParticipant({ role: "RECIPIENT", relationship: "daughter", age: 7 });
  const completeness = new JourneyCompletenessEngine().evaluate(journey.snapshot());
  const plan = new ConversationPlanner().plan({ journey: journey.snapshot(), completeness });
  assert.equal(plan.selected.type, "QUESTION");
  assert.equal(plan.selected.factKey, "occasion.type");
  assert.match(plan.selected.message, /celebrar|ocasión/i);
});

test("pasa a inspiración cuando el Journey está preparado", () => {
  let journey = baseJourney()
    .addParticipant({ role: "RECIPIENT", relationship: "daughter", age: 7 })
    .setFact({ key: "recipient.count", value: 1, source: "CONVERSATION" })
    .setFact({ key: "occasion.type", value: "birthday", source: "CONVERSATION" })
    .setFact({ key: "budget.max", value: 60, source: "CONVERSATION" });
  const completeness = new JourneyCompletenessEngine().evaluate(journey.snapshot());
  const plan = new ConversationPlanner().plan({ journey: journey.snapshot(), completeness });
  assert.equal(completeness.readyForInspiration, true);
  assert.equal(plan.selected.type, "INSPIRATION");
});

test("el plan conserva candidatos y razones explicables", () => {
  const journey = baseJourney();
  const completeness = new JourneyCompletenessEngine().evaluate(journey.snapshot());
  const plan = new ConversationPlanner().plan({ journey: journey.snapshot(), completeness });
  assert.equal(plan.candidates.length > 0, true);
  assert.equal(plan.selected.reasons.length > 0, true);
  assert.equal(plan.selected.plannerVersion, "v1.4-conversation-planner-v1");
});
