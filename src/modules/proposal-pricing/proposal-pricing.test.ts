import assert from "node:assert/strict";
import test from "node:test";
import { ProposalPricingService, inferTechnique } from "./proposal-pricing.service.js";

test("calcula precio, margen, marcaje e IVA", () => {
  const result = new ProposalPricingService().quote({ productUnitCost: 2, quantity: 100, technique: "laser", marginPercent: 35 });
  assert.equal(result.technique, "laser");
  assert.ok((result.recommendedUnitPrice ?? 0) > 2);
  assert.ok((result.totalWithVat ?? 0) > (result.subtotal ?? 0));
});

test("mantiene trazabilidad cuando falta la tarifa", () => {
  const result = new ProposalPricingService().quote({ productUnitCost: null, quantity: 500, categories: ["Técnicas de marcaje > Láser"] });
  assert.equal(result.recommendedUnitPrice, null);
  assert.equal(result.technique, "laser");
  assert.ok(result.warnings.length > 0);
});

test("infiere técnica desde categorías", () => {
  assert.equal(inferTechnique(["Marcaje > Serigrafía"]), "screen_printing");
});
