import assert from "node:assert/strict";
import test from "node:test";
import { canonicalProductHash } from "./canonical-hash.js";
import { toCanonicalProduct } from "./canonical-normalizer.js";

test("normalizes a provider product into the canonical model", () => {
  const product = toCanonicalProduct("demo", { id: "A-1", name: "Botella", categories: ["Bebida", "Bebida"], variants: [{ ref: "A-1-RED", color: "Rojo" }], images: ["https://example.com/a.jpg"] });
  assert.equal(product.externalId, "A-1");
  assert.deepEqual(product.categories, ["Bebida"]);
  const firstVariant = product.variants?.[0];
  const firstMedia = product.media?.[0];
  assert.ok(firstVariant);
  assert.ok(firstMedia);
  assert.equal(firstVariant.sku, "A-1-RED");
  assert.equal(firstMedia.isPrimary, true);
});

test("canonical hash is stable across object key order", () => {
  const a = toCanonicalProduct("demo", { id: "1", name: "Producto", metadata: { b: 2, a: 1 } });
  const b = toCanonicalProduct("demo", { name: "Producto", id: "1", metadata: { a: 1, b: 2 } });
  assert.equal(canonicalProductHash(a), canonicalProductHash(b));
});
