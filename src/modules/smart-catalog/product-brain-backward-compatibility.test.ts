import assert from "node:assert/strict";
import test from "node:test";
import { SmartCatalogService } from "./smart-catalog.service.js";
import type { SmartCatalogProduct, SmartCatalogRepository } from "./smart-catalog.types.js";

const legacyProduct: SmartCatalogProduct = {
  id: "legacy-mug",
  sku: "LEG-MUG-001",
  name: "Taza personalizable",
  category: "DRINKWARE",
  price: 14,
  cost: 5,
  currency: "EUR",
  stock: 10,
  productionDays: 2,
  tags: [],
  emotionalGoals: [],
  visualStyles: [],
  presentationTemplateIds: [],
  active: true,
  productBrain: {
    objectType: "mug",
    giftRoles: ["PRIMARY", "BUNDLE_COMPONENT"],
    interests: [],
    personalizationScore: 0.95,
    bundleScore: 0.8,
    premiumScore: 0.3,
    giftSuitabilityScore: 0.85,
    classificationConfidence: 0.9,
  },
};

const repository: SmartCatalogRepository = {
  async list() { return [legacyProduct]; },
  getById(id) { return id === legacyProduct.id ? legacyProduct : undefined; },
};

test("acepta perfiles Product Brain anteriores sin shapes", async () => {
  const recommendations = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"] }, 5);
  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0]?.product.id, "legacy-mug");
});
