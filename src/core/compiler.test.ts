import assert from "node:assert/strict";
import test from "node:test";
import { calculateCatalogMetrics } from "./metrics/catalog-metrics.js";
import { compileBlocks } from "./compiler.js";
import type { DocumentBlock } from "../modules/block-detector/block-detector.types.js";

const blocks: DocumentBlock[] = [{
  id: "p1-b1", page: 1, type: "PRODUCT", startLine: 1, endLine: 5,
  text: "20411 TURAM\nBotella de acero inoxidable\n500 ml\nLáser\n12,50 €",
  confidence: 0.95, signals: ["reference", "price"],
}];

test("compiler builds a product syntax tree and metrics", async () => {
  const result = await compileBlocks("sample.json", blocks, "makito");
  const product = result.output.nodes[0];
  assert.equal(product?.kind, "Product");
  assert.equal(result.metrics.length, 2);
  const metrics = calculateCatalogMetrics(result.output);
  assert.equal(metrics.products, 1);
  assert.equal(metrics.fieldCoverage.price, 1);
  assert.equal(metrics.fieldCoverage.material, 1);
});
