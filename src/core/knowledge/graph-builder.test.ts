import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalCatalog } from "../canonical/model.js";
import { KnowledgeLoader } from "../enrichment/knowledge-loader.js";
import { KnowledgeGraph } from "./graph.js";
import { KnowledgeGraphBuilder } from "./graph-builder.js";

const location = { page: 1, startLine: 1, endLine: 5 };

const catalog: CanonicalCatalog = {
  kind: "CanonicalCatalog",
  schemaVersion: "1.0",
  sourceFile: "sample.json",
  provider: "Makito",
  diagnostics: [],
  statistics: { totalProducts: 2, validProducts: 2, invalidProducts: 0, averageConfidence: 0.925 },
  products: [
    {
      id: "makito:20411",
      sku: "makito:20411",
      supplier: "Makito",
      supplierSku: "20411",
      name: "Turam",
      categories: [{ label: "Botellas", normalized: "botellas" }],
      valid: true,
      confidence: 0.95,
      prices: [{ amountMinor: 1250, currency: "EUR", formatted: "12,50 €" }],
      dimensions: ["750 ml"],
      materials: [{ label: "Acero inoxidable", normalized: "acero inoxidable" }],
      techniques: [{ label: "Láser", normalized: "laser" }],
      tags: [],
      warnings: [],
      source: {
        sourceFile: "sample.json",
        provider: "Makito",
        semanticProductId: "p1",
        rawText: "",
        location,
      },
    },
    {
      id: "makito:20412",
      sku: "makito:20412",
      supplier: "Makito",
      supplierSku: "20412",
      name: "Turam Mini",
      categories: [{ label: "Botellas", normalized: "botellas" }],
      valid: true,
      confidence: 0.9,
      prices: [{ amountMinor: 950, currency: "EUR", formatted: "9,50 €" }],
      dimensions: ["500 ml"],
      materials: [{ label: "acero inoxidable", normalized: "acero inoxidable" }],
      techniques: [{ label: "láser", normalized: "laser" }],
      tags: [],
      warnings: [],
      source: {
        sourceFile: "sample.json",
        provider: "Makito",
        semanticProductId: "p2",
        rawText: "",
        location,
      },
    },
  ],
};

test("graph builder consumes enriched products and deduplicates entities", () => {
  const enriched = new KnowledgeLoader().execute(catalog, {
    runId: "test",
    startedAt: "now",
    metadata: {},
  });

  const snapshot = new KnowledgeGraphBuilder().execute(enriched, {
    runId: "test",
    startedAt: "now",
    metadata: {},
  });

  const materials = snapshot.entities.filter(
    (entity) => entity.type === "attribute" && entity.attributeType === "material",
  );

  const laserTechniques = snapshot.entities.filter(
    (entity) =>
      entity.type === "attribute" &&
      entity.attributeType === "technique" &&
      entity.normalizedLabel === "laser",
  );

  const uvTechniques = snapshot.entities.filter(
    (entity) =>
      entity.type === "attribute" &&
      entity.attributeType === "technique" &&
      entity.normalizedLabel === "impresion-uv",
  );

  assert.equal(snapshot.statistics.products, 2);
  assert.equal(snapshot.statistics.categories, 1);
  assert.equal(materials.length, 1);
  assert.equal(laserTechniques.length, 1);
  assert.equal(uvTechniques.length, 1);
});

test("knowledge graph queries products by category, attribute and price", () => {
  const enriched = new KnowledgeLoader().execute(catalog, {
    runId: "test",
    startedAt: "now",
    metadata: {},
  });

  const graph = new KnowledgeGraph(
    new KnowledgeGraphBuilder().execute(enriched, {
      runId: "test",
      startedAt: "now",
      metadata: {},
    }),
  );

  const products = graph.products({
    category: "botellas",
    attributes: { material: "ACERO INOXIDABLE", technique: "laser" },
    maxPriceMinor: 1000,
    validOnly: true,
  });

  assert.deepEqual(
    products.map((product) => product.reference),
    ["20412"],
  );
});
