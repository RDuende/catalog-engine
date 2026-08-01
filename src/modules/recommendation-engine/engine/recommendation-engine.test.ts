import assert from "node:assert/strict";
import test from "node:test";
import { RecommendationEngine } from "./recommendation-engine.js";
import { createCoreRecommendationRules } from "../rules/core.rules.js";

const engine = new RecommendationEngine(createCoreRecommendationRules());

const base = {
  productId: "p1",
  name: "Botella RPET",
  searchableText: "Botella ecológica fabricada en RPET reciclado",
  unitPrice: 3.5,
  customizable: true,
  popularityScore: 7,
  categories: ["Botellas"],
  knowledge: ["RPET"],
};

test("scores and explains a matching product", () => {
  const result = engine.evaluate(base, {
    query: "botella ecológica",
    budget: 4,
    quantity: 100,
    currency: "EUR",
    customizable: true,
  });
  assert.ok(result.score > 0);
  assert.ok(result.reasons.some((reason) => reason.includes("presupuesto")));
  assert.equal(result.warnings.length, 0);
});

test("penalizes products outside budget", () => {
  const result = engine.evaluate({ ...base, unitPrice: 8 }, {
    query: "botella",
    budget: 4,
    quantity: 100,
    currency: "EUR",
  });
  assert.ok(result.warnings.some((warning) => warning.includes("Supera")));
  assert.ok(result.factors.some((factor) => factor.ruleId === "budget" && factor.points < 0));
});

test("ranks the strongest candidate first", () => {
  const results = engine.rank([
    { ...base, productId: "p2", name: "Producto genérico", searchableText: "producto", unitPrice: 3.5 },
    base,
  ], {
    query: "botella ecológica",
    budget: 4,
    quantity: 100,
    currency: "EUR",
  });
  assert.equal(results[0]?.candidate.productId, "p1");
});


test("uses commercial memory to improve ranking", () => {
  const results = engine.rank([
    { ...base, productId: "p-low", memoryScore: -15, memoryEvidence: ["1 rejected"] },
    { ...base, productId: "p-high", memoryScore: 30, memoryEvidence: ["1 purchased"] },
  ], { query: "botella ecológica", quantity: 100, currency: "EUR" });
  assert.equal(results[0]?.candidate.productId, "p-high");
  assert.ok(results[0]?.reasons.some((reason) => reason.includes("memoria comercial")));
});
