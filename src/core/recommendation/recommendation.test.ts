import assert from "node:assert/strict";
import test from "node:test";
import type { KnowledgeGraphSnapshot } from "../knowledge/model.js";
import { RecommendationEngine } from "./engine.js";

const snapshot: KnowledgeGraphSnapshot = {
  kind: "KnowledgeGraph",
  sourceFile: "recommendation-test.json",
  entities: [
    {
      id: "product:ref:TAZA-1", type: "product", label: "Taza para profesor", normalizedLabel: "taza-para-profesor",
      reference: "TAZA-1", priceMinor: 1295, valid: true, confidence: 0.95,
      metadata: { description: "Taza personalizable para regalo de fin de curso", dna: { personalization: { score: 0.9 } } },
    },
    {
      id: "product:ref:BOT-1", type: "product", label: "Botella deportiva", normalizedLabel: "botella-deportiva",
      reference: "BOT-1", priceMinor: 1895, valid: true, confidence: 0.9,
      metadata: { description: "Botella de acero", dna: { personalization: { score: 0.3 } } },
    },
    {
      id: "product:ref:INVALID", type: "product", label: "Producto inválido", normalizedLabel: "producto-invalido",
      reference: "INVALID", priceMinor: 500, valid: false, confidence: 0.4, metadata: {},
    },
    { id: "category:tazas", type: "category", label: "Tazas", normalizedLabel: "tazas", confidence: 1, metadata: {} },
    { id: "category:botellas", type: "category", label: "Botellas", normalizedLabel: "botellas", confidence: 1, metadata: {} },
    { id: "attribute:audience:profesor", type: "attribute", attributeType: "audience", label: "Profesor", value: "Profesor", normalizedLabel: "profesor", confidence: 1, metadata: {} },
    { id: "attribute:occasion:fin-de-curso", type: "attribute", attributeType: "occasion", label: "Fin de curso", value: "Fin de curso", normalizedLabel: "fin-de-curso", confidence: 1, metadata: {} },
    { id: "attribute:material:acero", type: "attribute", attributeType: "material", label: "Acero", value: "Acero", normalizedLabel: "acero", confidence: 1, metadata: {} },
  ],
  relations: [
    { id: "r1", from: "product:ref:TAZA-1", to: "category:tazas", type: "BELONGS_TO", confidence: 1, metadata: {} },
    { id: "r2", from: "product:ref:TAZA-1", to: "attribute:audience:profesor", type: "HAS_ATTRIBUTE", confidence: 1, metadata: {} },
    { id: "r3", from: "product:ref:TAZA-1", to: "attribute:occasion:fin-de-curso", type: "HAS_ATTRIBUTE", confidence: 1, metadata: {} },
    { id: "r4", from: "product:ref:BOT-1", to: "category:botellas", type: "BELONGS_TO", confidence: 1, metadata: {} },
    { id: "r5", from: "product:ref:BOT-1", to: "attribute:material:acero", type: "HAS_ATTRIBUTE", confidence: 1, metadata: {} },
  ],
  statistics: { products: 3, categories: 2, attributes: 3, relations: 5 },
};

test("recommendation engine ranks the strongest semantic match first", () => {
  const result = new RecommendationEngine(snapshot).recommend({
    query: "regalo para profesor fin de curso",
    categories: ["tazas"],
    attributes: { audience: ["profesor"], occasion: ["fin de curso"] },
    maxPriceMinor: 2000,
    personalization: true,
    limit: 5,
  });

  assert.equal(result.totalProducts, 3);
  assert.equal(result.eligibleProducts, 2);
  assert.equal(result.items[0]?.product.reference, "TAZA-1");
  assert.ok((result.items[0]?.score ?? 0) > (result.items[1]?.score ?? 0));
  assert.ok(result.items[0]?.reasons.some((reason) => reason.includes("atributos")));
});

test("recommendation engine enforces price and validity filters", () => {
  const result = new RecommendationEngine(snapshot).recommend({ maxPriceMinor: 1500 });
  assert.deepEqual(result.items.map((item) => item.product.reference), ["TAZA-1"]);
});

test("recommendation engine supports custom weights and minimum score", () => {
  const result = new RecommendationEngine(snapshot).recommend({
    categories: ["botellas"],
    weights: { category: 80, confidence: 0 },
    minimumScore: 50,
  });
  assert.deepEqual(result.items.map((item) => item.product.reference), ["BOT-1"]);
});
