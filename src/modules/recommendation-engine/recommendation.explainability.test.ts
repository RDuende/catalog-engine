import assert from "node:assert/strict";
import test from "node:test";
import { RecommendationEngine } from "./engine/recommendation-engine.js";
import { createCoreRecommendationRules } from "./rules/core.rules.js";

test("ranking factors distinguish matches and violations", () => {
  const engine = new RecommendationEngine(createCoreRecommendationRules());
  const result = engine.evaluate({
    productId: "p1", name: "Botella", searchableText: "botella acero", unitPrice: 7,
    customizable: false, popularityScore: 0, categories: [], knowledge: [],
  }, { query: "botella", budget: 5, quantity: 100, currency: "EUR", customizable: true });
  assert.equal(result.factors.find((f) => f.ruleId === "text-relevance")?.matched, true);
  assert.equal(result.factors.find((f) => f.ruleId === "budget")?.matched, false);
  assert.equal(result.factors.find((f) => f.ruleId === "customizable")?.matched, false);
});
