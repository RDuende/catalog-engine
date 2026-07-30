import assert from "node:assert/strict";
import test from "node:test";
import { IntentEngine } from "../../core/intent/index.js";
import {
  DEFAULT_SOLUTION_DEFINITIONS,
  SolutionRecommendationOrchestrator,
} from "../../core/solution/index.js";
import {
  mapAnalysisToRecommendationRequest,
  mapPlanToRecommendationRequest,
} from "./intent.service.js";

test("maps natural-language intent to the database recommendation request", () => {
  const analysis = new IntentEngine().analyze(
    "Necesito 40 regalos de madera para una profesora por menos de 25 euros, personalizados",
    { defaultLimit: 8 },
  );

  const request = mapAnalysisToRecommendationRequest(analysis, {
    query: analysis.intent.rawText,
    limit: 8,
    currency: "EUR",
    debug: true,
  });

  assert.equal(request.budget, 25);
  assert.equal(request.customizable, true);
  assert.equal(request.limit, 8);
  assert.equal(request.currency, "EUR");
  assert.equal(request.debug, true);
  assert.ok(request.knowledgeSlugs?.includes("madera"));
  assert.ok(request.knowledgeSlugs?.includes("profesor"));
});

test("adds the selected solution to the recommendation request", () => {
  const analysis = new IntentEngine().analyze(
    "Busco un detalle personalizado para una profesora por fin de curso",
    { defaultLimit: 6 },
  );
  const plan = new SolutionRecommendationOrchestrator(DEFAULT_SOLUTION_DEFINITIONS)
    .plan(analysis);

  const request = mapPlanToRecommendationRequest(plan, {
    query: analysis.intent.rawText,
    limit: 6,
    currency: "EUR",
    debug: false,
  });

  assert.equal(plan.primarySolution?.definition.id, "gift-teacher-thanks");
  assert.match(request.query, /Detalle de agradecimiento para docente/);
  assert.ok(request.knowledgeSlugs?.includes("profesor"));
});
