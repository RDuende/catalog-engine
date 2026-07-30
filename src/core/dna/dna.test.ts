import assert from "node:assert/strict";
import test from "node:test";
import { ProductDnaBuilder, validateProductDNA } from "./index.js";

test("construye y valida ADN de producto", () => {
  const dna = new ProductDnaBuilder().build({
    productId: "p1",
    title: "Taza elegante para profesora",
    description: "Regalo de agradecimiento para fin de curso",
    tags: ["personalizado"],
    personalization: true,
  }, new Date("2026-07-26T10:00:00.000Z"));
  assert.equal(dna.recipients.some((item) => item.value === "profesora"), true);
  assert.equal(dna.occasions.some((item) => item.value === "fin de curso"), true);
  assert.equal(dna.emotions.some((item) => item.value === "agradecimiento"), true);
  assert.equal(validateProductDNA(dna).valid, true);
});
