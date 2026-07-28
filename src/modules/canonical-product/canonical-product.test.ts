import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogKnowledgeData } from "../catalog-knowledge/knowledge-types.js";
import { buildCanonicalCatalog } from "./canonical-builder.js";
import { CanonicalProductEngine } from "./canonical-product-engine.js";

function knowledge(provider: string, reference: string, category: string, material: string, terms: string[]): CatalogKnowledgeData {
  return {
    version: "0.31.0",
    provider,
    sourceFile: `${provider}.json`,
    createdAt: new Date(0).toISOString(),
    references: {
      [reference]: { reference, provider, pages: [1], categories: [category], materials: [material], variants: [], terms },
    },
    families: {
      botellas: { id: "botellas", name: "BOTELLAS", references: [reference], pages: [1] },
    },
    categories: { [category.toLowerCase()]: [reference] },
    materials: { [material]: [reference] },
    terms: Object.fromEntries(terms.map((term) => [term, [reference]])),
  };
}

const data = buildCanonicalCatalog([
  {
    knowledge: knowledge("Makito", "20411", "Botellas", "bambu", ["botella", "bambu", "500", "ml", "tapon"]),
    offers: [{ provider: "Makito", reference: "20411", price: 8.4, stock: 200, leadTimeDays: 2, moq: 1 }],
  },
  {
    knowledge: knowledge("PF Concept", "PFC-887", "Botellas", "bambu", ["botella", "bambu", "500", "ml", "tapon"]),
    offers: [{ provider: "PF Concept", reference: "PFC-887", price: 7.9, stock: 40, leadTimeDays: 4, moq: 1 }],
  },
  {
    knowledge: knowledge("Giving", "GV-10", "Tazas", "ceramica", ["taza", "ceramica", "350", "ml"]),
    offers: [{ provider: "Giving", reference: "GV-10", price: 4.5, stock: 100, leadTimeDays: 1, moq: 1 }],
  },
]);
const engine = new CanonicalProductEngine(data);

test("unifica referencias equivalentes de distintos proveedores", () => {
  const product = engine.findByReference("Makito", "20411");
  assert.ok(product);
  assert.equal(product.offers.length, 2);
  assert.equal(engine.findByReference("PF Concept", "PFC-887")?.id, product.id);
});

test("mantiene productos diferentes separados", () => {
  assert.notEqual(engine.findByReference("Giving", "GV-10")?.id, engine.findByReference("Makito", "20411")?.id);
});

test("selecciona la mejor oferta según precio y restricciones", () => {
  const product = engine.findByReference("Makito", "20411")!;
  assert.equal(engine.bestOffer(product, { quantity: 20, requireStock: true })?.provider, "PF Concept");
  assert.equal(engine.bestOffer(product, { quantity: 100, requireStock: true })?.provider, "Makito");
});

test("busca sobre el producto canónico", () => {
  const result = engine.search("botella bambú")[0];
  assert.ok(result);
  assert.equal(result.product.offers.length, 2);
});
