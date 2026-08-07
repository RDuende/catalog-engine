import assert from "node:assert/strict";
import test from "node:test";
import { SmartCatalogService } from "./smart-catalog.service.js";

test("mantiene soportes genéricos personalizables como alternativas secundarias", async () => {
  const product = {
    id: "generic-mug", sku: "MUG-1", name: "Taza blanca", description: "Taza para sublimación",
    category: "Tazas", price: 12, priceKnown: true, cost: 4, currency: "EUR", stock: 20,
    productionDays: 2, tags: [], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true,
    brain: { objectType: "mug", giftRoles: ["PRIMARY", "BUNDLE_COMPONENT"] as const, interests: [],
      personalizationScore: 0.9, bundleScore: 0.8, premiumScore: 0.3, giftSuitabilityScore: 0.9, classificationConfidence: 0.9 },
  };
  const repository = {
    async list() { return [product]; },
    getById(id: string) { return id === product.id ? product : undefined; },
  };
  const results = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"] }, 10);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.product.id, "generic-mug");
  assert.equal(results[0]?.reasons.some((reason) => reason.includes("genérico altamente personalizable")), true);
  assert.equal((results[0]?.breakdown.interests ?? 0) < 0.4, true);
});
