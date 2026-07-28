import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalCatalogData, CanonicalProduct } from "../canonical-product/canonical-types.js";
import { SemanticRecommendationEngine } from "./recommendation-engine.js";

function product(id: string, name: string, category: string, material: string, terms: string[], price: number, stock = 100): CanonicalProduct {
  return {
    id, name, family: category, categories: [category], materials: [material], terms, variants: [], confidence: 1,
    sourceReferences: [id], offers: [{ id: `makito:${id}`, provider: "Makito", reference: id, price, currency: "EUR", stock, leadTimeDays: 2, moq: 1, sourcePages: [1] }],
  };
}

const products = {
  bottle: product("cp-bottle", "Botella de bambú 500 ml", "Botellas", "bambu", ["botella", "bambu", "premium", "500", "ml"], 24.5),
  mug: product("cp-mug", "Taza cerámica", "Tazas", "ceramica", ["taza", "ceramica", "350", "ml"], 9.5),
  pen: product("cp-pen", "Bolígrafo de aluminio", "Bolígrafos", "aluminio", ["boligrafo", "aluminio"], 3.2, 0),
};
const data: CanonicalCatalogData = {
  version: "0.33.0", createdAt: new Date(0).toISOString(), products,
  offerToProduct: { "makito:cp-bottle": "cp-bottle", "makito:cp-mug": "cp-mug", "makito:cp-pen": "cp-pen" }, matches: [],
};
const engine = new SemanticRecommendationEngine(data);

test("recomienda y ordena por afinidad semántica", () => {
  const run = engine.recommend({ audiences: ["profesor"], occasions: ["jubilacion"], styles: ["elegante"], personalization: ["laser"], budget: { max: 35 }, requireStock: true });
  assert.equal(run.results[0]?.product.id, "cp-bottle");
  assert.ok((run.results[0]?.score ?? 0) > (run.results[1]?.score ?? 0));
});

test("aplica filtros duros de material y stock", () => {
  const run = engine.recommend({ required: { material: ["bambu"] }, requireStock: true });
  assert.deepEqual(run.results.map((result) => result.product.id), ["cp-bottle"]);
  assert.ok(run.rejected.some((item) => item.productId === "cp-pen"));
});

test("devuelve desglose y explicación reproducible", () => {
  const result = engine.recommend({ styles: ["elegante"], personalization: ["laser"] }).results[0];
  assert.ok(result);
  assert.ok(result.breakdown.some((item) => item.key === "style"));
  assert.match(result.explanation, /Recomiendo/);
  assert.ok(result.affinity > 0);
});

test("respeta presupuesto máximo", () => {
  const run = engine.recommend({ categories: ["botellas"], budget: { max: 10 } });
  assert.ok(run.rejected.some((item) => item.productId === "cp-bottle" && item.reasons.includes("supera el presupuesto máximo")));
});

test("permite sobrescribir el Product DNA", () => {
  const custom = new SemanticRecommendationEngine(data, { "cp-mug": { productId: "cp-mug", audiences: ["medico"], occasions: ["jubilacion"] } });
  const result = custom.recommend({ audiences: ["medico"], occasions: ["jubilacion"] }).results[0];
  assert.equal(result?.product.id, "cp-mug");
});
