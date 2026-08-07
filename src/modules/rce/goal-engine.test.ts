import assert from "node:assert/strict";
import test from "node:test";
import { createConversationState, RaiConversationEngine } from "./engine.js";
import { RceGoalEngine } from "./goal-engine.js";
import { planNextQuestion } from "./question-planner.js";

const conversation = new RaiConversationEngine();
const goals = new RceGoalEngine();

function stateFrom(text: string) {
  return conversation.process(
    createConversationState("c1", "2026-08-04T09:00:00.000Z"),
    { id: "m1", role: "USER", text, createdAt: "2026-08-04T09:00:01.000Z" },
  ).state;
}

test("no pregunta datos ya presentes", () => {
  const plan = goals.plan(stateFrom("Un regalo para mi sobrino por su décimo cumpleaños, le gusta el fútbol y tengo 30 €"));
  assert.equal(plan.readyForProposals, true);
  assert.equal(plan.goals.find((g) => g.factKey === "recipient.interests")?.status, "SATISFIED");
  assert.equal(plan.goals.find((g) => g.factKey === "budget.max")?.status, "SATISFIED");
});

test("prioriza ocasión cuando solo conoce relación", () => {
  assert.equal(goals.plan(stateFrom("Es para mi sobrino")).nextGoal?.factKey, "occasion.type");
});

test("prioriza intereses cuando conoce ocasión y relación", () => {
  assert.equal(goals.plan(stateFrom("Es para mi sobrino por su cumpleaños")).nextGoal?.factKey, "recipient.interests");
});

test("deja de preguntar cuando ya puede proponer", () => {
  const question = planNextQuestion(goals.plan(stateFrom("Es para mi sobrino por su cumpleaños, le gusta Marvel")));
  assert.equal(question.readyForProposals, true);
  assert.equal(question.question, undefined);
});
