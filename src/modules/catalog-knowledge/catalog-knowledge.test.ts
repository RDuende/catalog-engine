import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCatalog } from "../catalog-analyzer/catalog-analyzer.js";
import { buildKnowledge } from "./knowledge-builder.js";
import { CatalogKnowledge } from "./catalog-knowledge.js";

const pages = [
  { page: 1, text: "BOTELLAS\n20411 Turam\nBotella de bambú 500 ml\nMedidas 7 x 25 cm\n8,40 7,90" },
  { page: 2, text: "BOTELLAS\n20411 Turam\nBotella bambú color negro\nMedidas 7 x 25 cm\n8,40 7,90" },
  { page: 3, text: "TAZAS\n30500 Lume\nTaza de acero 350 ml\nMedidas 8 x 10 cm\n5,00 4,50" },
];

const report = analyzeCatalog({ sourceFile: "makito.json", sourceHash: "hash", pages, startedAt: Date.now() });
const data = buildKnowledge(report, pages);
const knowledge = new CatalogKnowledge(data);

test("construye y fusiona el índice de referencias", () => {
  assert.deepEqual(knowledge.findReference("20411")?.pages, [1, 2]);
});

test("indexa categorías y familias", () => {
  assert.deepEqual(knowledge.findCategory("BOTELLAS").map((node) => node.reference), ["20411"]);
  assert.deepEqual(knowledge.findFamily("botellas")?.references, ["20411"]);
});

test("indexa materiales", () => {
  assert.deepEqual(knowledge.findMaterial("bambú").map((node) => node.reference), ["20411"]);
  assert.deepEqual(knowledge.findMaterial("acero").map((node) => node.reference), ["30500"]);
});

test("busca por texto y referencia", () => {
  assert.equal(knowledge.search("botella bambú")[0]?.reference, "20411");
  assert.equal(knowledge.search("30500")[0]?.reference, "30500");
});
