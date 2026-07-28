import assert from "node:assert/strict";
import test from "node:test";
import { buildProductDNA } from "../recommendation-engine/product-dna-builder.js";
import { SemanticTaxonomyEngine } from "./taxonomy-engine.js";
import { buildTaxonomy } from "./taxonomy-builder.js";
import type { CanonicalProduct } from "../canonical-product/canonical-types.js";

const product = {
  id: "canonical-1", name: "Vaso Bamboo", family: "vasos", categories: ["bebida"], materials: ["bamboo"], terms: [], offers: [], sourceReferences: [],
} as unknown as CanonicalProduct;

const taxonomy = new SemanticTaxonomyEngine(buildTaxonomy([
  { id: "bambu", aliases: ["bamboo"], relations: [{ target: "eco", type: "inherits" }, { target: "laser", type: "supports" }] },
  { id: "eco", relations: [{ target: "sostenible", type: "inherits" }] },
  { id: "sostenible" }, { id: "laser" },
]));

test("Product DNA hereda conocimiento desde la taxonomía", () => {
  const dna = buildProductDNA(product, taxonomy);
  assert.ok(dna.values.includes("eco"));
  assert.ok(dna.values.includes("sostenible"));
  assert.ok(dna.personalization.includes("laser"));
  assert.ok(dna.terms.includes("bambu"));
});
