import assert from "node:assert/strict";
import test from "node:test";
import { IntentEngine } from "../../core/intent/index.js";
import { mapAnalysisToRecommendationRequest } from "./intent.service.js";

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
