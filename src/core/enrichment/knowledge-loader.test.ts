import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalCatalog } from "../canonical/model.js";
import { KnowledgeLoader } from "./knowledge-loader.js";

const catalog: CanonicalCatalog = {
  kind: "CanonicalCatalog", schemaVersion: "1.0", sourceFile: "sample.json", provider: "Makito", diagnostics: [],
  statistics: { totalProducts: 1, validProducts: 1, invalidProducts: 0, averageConfidence: 0.95 },
  products: [{
    id: "makito:1", sku: "makito:1", supplier: "Makito", supplierSku: "1", name: "Taza de cerámica blanca", description: "Ideal para regalo con fotografía",
    categories: [{ label: "Tazas", normalized: "tazas" }], materials: [{ label: "Cerámica", normalized: "ceramica" }], techniques: [], dimensions: [], prices: [], tags: [], valid: true, confidence: 0.95, warnings: [],
    source: { sourceFile: "sample.json", provider: "Makito", semanticProductId: "p1", rawText: "Taza", location: { page: 1, startLine: 1, endLine: 2 } }
  }]
};

test("knowledge loader enriches ontology and calculates product DNA", () => {
  const result = new KnowledgeLoader().execute(catalog, { runId: "test", startedAt: "now", metadata: {} });
  const product = result.products[0]!;
  assert.equal(result.kind, "EnrichedCatalog");
  assert.ok(product.ontology.productTypes.some(v => v.normalized === "taza"));
  assert.ok(product.techniques.some(v => v.normalized === "sublimacion"));
  assert.ok(product.dna.memory.score >= 0.82);
  assert.ok(product.dna.personalization.score >= 0.95);
});
