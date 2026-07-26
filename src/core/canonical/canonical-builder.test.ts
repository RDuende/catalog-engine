import assert from "node:assert/strict";
import test from "node:test";
import type { SemanticCatalog } from "../semantic/model.js";
import { CanonicalProductBuilder } from "./canonical-builder.js";

const location = { page: 1, startLine: 1, endLine: 5 };

const catalog: SemanticCatalog = {
  kind: "SemanticCatalog",
  sourceFile: "makito.json",
  categories: ["Botellas"],
  diagnostics: [],
  statistics: { validProducts: 1, invalidProducts: 0, ignoredTextNodes: 0, averageConfidence: 0.95 },
  products: [{
    id: "p1",
    reference: " 20411 ",
    name: "  Turam  ",
    description: " Botella térmica ",
    category: "Botellas",
    prices: [{ amountMinor: 1250, currency: "EUR", formatted: "12,50 €" }],
    dimensions: ["750 ml", "750 ml"],
    materials: ["Acero inoxidable", "acero inoxidable"],
    techniques: ["Láser"],
    valid: true,
    confidence: 0.95,
    missing: [],
    warnings: [],
    source: { rawText: "20411 TURAM", location },
  }],
};

test("canonical builder creates provider-independent normalized products", () => {
  const result = new CanonicalProductBuilder().execute(catalog, {
    runId: "test",
    startedAt: "now",
    metadata: { provider: "Makito" },
  });
  const product = result.products[0];
  assert.equal(result.schemaVersion, "1.0");
  assert.equal(result.provider, "Makito");
  assert.equal(product?.id, "makito:20411");
  assert.equal(product?.supplierSku, "20411");
  assert.equal(product?.name, "Turam");
  assert.deepEqual(product?.materials, [{ label: "Acero inoxidable", normalized: "acero inoxidable" }]);
  assert.deepEqual(product?.dimensions, ["750 ml"]);
  assert.ok(product?.tags.includes("laser"));
});

test("canonical builder invalidates products without canonical identity", () => {
  const invalid: SemanticCatalog = {
    ...catalog,
    products: [{ ...catalog.products[0]!, reference: undefined, name: undefined, valid: false }],
  };
  const result = new CanonicalProductBuilder().execute(invalid, { runId: "test", startedAt: "now", metadata: {} });
  assert.equal(result.products[0]?.valid, false);
  assert.ok(result.diagnostics.some((item) => item.code === "CANONICAL_SKU_MISSING"));
  assert.ok(result.diagnostics.some((item) => item.code === "CANONICAL_NAME_MISSING"));
});
