import assert from "node:assert/strict";
import test from "node:test";
import { BusinessDecisionEngine, type BusinessCandidate, type BusinessScorer } from "./index.js";
import type { CanonicalProduct, ProviderOffer } from "../canonical-product/canonical-types.js";

function product(id: string): CanonicalProduct {
  return { id, name: id, categories: [], materials: [], terms: [], variants: [], offers: [], sourceReferences: [], confidence: 1 };
}
function offer(provider: string, price: number, stock: number, leadTimeDays: number): ProviderOffer {
  return { id: provider, provider, reference: provider, price, stock, leadTimeDays, sourcePages: [] };
}

test("ranks the stronger business candidate first", () => {
  const candidates: BusinessCandidate[] = [
    { product: product("A"), offer: offer("Makito", 5, 100, 1), affinity: 90, sellingPrice: 12, sustainabilityScore: 80 },
    { product: product("B"), offer: offer("Other", 9, 2, 5), affinity: 70, sellingPrice: 12, sustainabilityScore: 40 },
  ];
  const run = new BusinessDecisionEngine().evaluate(candidates, { quantity: 10, preferredProviders: ["Makito"] });
  assert.equal(run.results[0]?.product.id, "A");
  assert.ok((run.results[0]?.score ?? 0) > (run.results[1]?.score ?? 0));
});

test("supports strategy weight profiles", () => {
  const candidates: BusinessCandidate[] = [
    { product: product("FAST"), offer: offer("A", 9, 100, 1), affinity: 60, sellingPrice: 12 },
    { product: product("FIT"), offer: offer("B", 5, 100, 7), affinity: 98, sellingPrice: 12 },
  ];
  const run = new BusinessDecisionEngine().evaluate(candidates, {}, { name: "speed", weights: { delivery: 10, affinity: 0.1 }, disabledDimensions: ["sustainability", "strategy"], minimumScore: 0 });
  assert.equal(run.results[0]?.product.id, "FAST");
});

test("keeps the score traceable", () => {
  const run = new BusinessDecisionEngine().evaluate([{ product: product("A"), offer: offer("A", 5, 10, 2), affinity: 85, sellingPrice: 10 }]);
  assert.ok(run.results[0]?.dimensions.some((item) => item.dimension === "margin"));
  assert.ok((run.results[0]?.reasons.length ?? 0) > 0);
  assert.equal(typeof run.results[0]?.confidence, "number");
});

test("allows a scorer plugin to be replaced", () => {
  const custom: BusinessScorer = { dimension: "strategy", score: () => ({ dimension: "strategy", score: 100, weight: 1, weightedScore: 100, reasons: ["Custom plugin"] }) };
  const engine = new BusinessDecisionEngine().register(custom);
  const run = engine.evaluate([{ product: product("A") }]);
  assert.ok(run.results[0]?.reasons.includes("Custom plugin"));
});
