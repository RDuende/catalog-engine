import assert from "node:assert/strict";
import test from "node:test";
import { IntentEngine } from "../intent/index.js";
import { DEFAULT_SOLUTION_DEFINITIONS } from "./default-definitions.js";
import { SolutionRecommendationOrchestrator } from "./orchestrator.js";

test("plans teacher recommendations through a resolved solution", () => {
  const analysis = new IntentEngine().analyze(
    "Necesito un regalo personalizado para una profesora por menos de 25 euros",
    { defaultLimit: 8 },
  );

  const plan = new SolutionRecommendationOrchestrator(DEFAULT_SOLUTION_DEFINITIONS)
    .plan(analysis);

  assert.equal(plan.primarySolution?.definition.id, "gift-teacher-thanks");
  assert.equal(plan.criteria.maxPriceMinor, 2500);
  assert.equal(plan.criteria.personalization, true);
  assert.ok(plan.solutions.length >= 1);
});
