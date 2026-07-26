import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogSyntaxTree } from "../ast/nodes.js";
import { SemanticAnalyzer } from "./semantic-analyzer.js";

const location = { page: 1, startLine: 1, endLine: 5 };

test("semantic analyzer normalizes and validates a product", () => {
  const tree: CatalogSyntaxTree = {
    kind: "Catalog",
    sourceFile: "sample.json",
    diagnostics: [],
    nodes: [
      { id: "c1", kind: "Category", name: "Botellas", confidence: 0.9, location },
      {
        id: "p1", kind: "Product", rawText: "20411 TURAM", confidence: 0.95, location,
        fields: [
          { id: "f1", kind: "Field", field: "reference", value: "ref. 20411", confidence: 0.9, location },
          { id: "f2", kind: "Field", field: "name", value: "  TURAM  ", confidence: 0.8, location },
          { id: "f3", kind: "Field", field: "price", value: "12,50 €", confidence: 0.95, location },
          { id: "f4", kind: "Field", field: "material", value: "Acero inoxidable", confidence: 0.8, location },
          { id: "f5", kind: "Field", field: "technique", value: "Láser", confidence: 0.8, location },
        ],
      },
    ],
  };

  const result = new SemanticAnalyzer().execute(tree, { runId: "test", startedAt: "now", metadata: {} });
  const product = result.products[0];
  assert.equal(product?.valid, true);
  assert.equal(product?.reference, "20411");
  assert.equal(product?.category, "Botellas");
  assert.equal(product?.prices[0]?.amountMinor, 1250);
  assert.equal(product?.prices[0]?.formatted, "12,50 €");
  assert.deepEqual(product?.materials, ["acero inoxidable"]);
});

test("semantic analyzer rejects a product without identity", () => {
  const tree: CatalogSyntaxTree = {
    kind: "Catalog", sourceFile: "invalid.json", diagnostics: [],
    nodes: [{ id: "p2", kind: "Product", rawText: "12,50 €", fields: [], confidence: 0.8, location }],
  };
  const result = new SemanticAnalyzer().execute(tree, { runId: "test", startedAt: "now", metadata: {} });
  assert.equal(result.products[0]?.valid, false);
  assert.deepEqual(result.products[0]?.missing, ["reference", "name"]);
  assert.equal(result.statistics.invalidProducts, 1);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "SEMANTIC_REFERENCE_MISSING"));
});
