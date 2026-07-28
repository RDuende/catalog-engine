import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCatalog } from "../catalog-analyzer/catalog-analyzer.js";
import { buildKnowledge } from "../catalog-knowledge/knowledge-builder.js";
import { buildProductKnowledgeGraph } from "./graph-builder.js";
import { ProductKnowledgeGraph } from "./product-knowledge-graph.js";

const pages = [
  { page: 1, text: "BOTELLAS\n20411 Turam\nBotella de bambú 500 ml\n8,40 7,90" },
  { page: 2, text: "BOTELLAS\n20412 Lumo\nBotella de acero 750 ml\n9,40 8,90" },
  { page: 3, text: "TAZAS\n30500 Lume\nTaza de acero 350 ml\n5,00 4,50" },
];
const report = analyzeCatalog({ sourceFile: "makito.json", sourceHash: "hash", pages, startedAt: Date.now() });
const knowledge = buildKnowledge(report, pages);
const graph = new ProductKnowledgeGraph(buildProductKnowledgeGraph(knowledge));

test("crea nodos y relaciones de producto", () => {
  assert.equal(graph.getProduct("20411")?.type, "PRODUCT");
  assert.deepEqual(graph.neighbors("product:20411", "MADE_OF").map((node) => node.label), ["bambu"]);
});

test("busca productos recorriendo el grafo", () => {
  assert.equal(graph.searchProducts("botella bambú")[0]?.reference, "20411");
  assert.equal(graph.searchProducts("acero")[0]?.reference, "20412");
});

test("encuentra productos relacionados", () => {
  const related = graph.relatedProducts("20412");
  assert.equal(related[0]?.reference, "20411");
  assert.ok(related[0]?.reasons.some((reason) => /BOTELLAS/i.test(reason)));
});
