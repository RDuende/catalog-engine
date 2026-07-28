import assert from "node:assert/strict";
import test from "node:test";
import { SemanticTaxonomyEngine } from "./taxonomy-engine.js";
import { buildTaxonomy } from "./taxonomy-builder.js";

const taxonomy = new SemanticTaxonomyEngine(buildTaxonomy([
  { id: "bambu", aliases: ["bamboo"], relations: [
    { target: "eco", type: "inherits", weight: 0.95 },
    { target: "laser", type: "supports", weight: 0.9 },
  ] },
  { id: "eco", relations: [{ target: "sostenible", type: "inherits", weight: 0.9 }] },
  { id: "sostenible" },
  { id: "laser", aliases: ["grabado láser"] },
]));

test("resuelve aliases de forma normalizada", () => {
  assert.equal(taxonomy.resolve("BAMBOO"), "bambu");
  assert.equal(taxonomy.resolve("Grabado láser"), "laser");
});

test("expande herencia transitiva y capacidades", () => {
  const expanded = taxonomy.expand(["bambu"]);
  const concepts = new Set(expanded.map((item) => item.concept));
  assert.deepEqual(concepts, new Set(["bambu", "eco", "sostenible", "laser"]));
  assert.ok((expanded.find((item) => item.concept === "sostenible")?.score ?? 0) > 0.8);
});

test("busca conceptos por etiqueta y alias", () => {
  assert.equal(taxonomy.search("grabado")[0]?.id, "laser");
});
