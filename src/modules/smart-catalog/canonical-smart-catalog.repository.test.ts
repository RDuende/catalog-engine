import assert from "node:assert/strict";
import test from "node:test";
import { SmartCatalogService } from "./smart-catalog.service.js";
import type { SmartCatalogRepository } from "./smart-catalog.types.js";

test("prioriza productos del catálogo relacionados con fútbol", async () => {
  const repository: SmartCatalogRepository = {
    async list() {
      return [
        { id: "generic", sku: "GEN", name: "Taza", category: "DRINKWARE", price: 10, cost: 4, currency: "EUR", stock: 10, productionDays: 2, tags: ["desayuno"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
        { id: "football", sku: "FTB", name: "Botella deportiva fútbol", category: "SPORT", price: 15, cost: 6, currency: "EUR", stock: 10, productionDays: 2, tags: ["futbol", "deporte", "equipo"], emotionalGoals: [], visualStyles: [], presentationTemplateIds: [], active: true },
      ];
    },
    getById() { return undefined; },
  };
  const results = await new SmartCatalogService(repository).recommend({ interests: ["fútbol"] }, 2);
  assert.equal(results[0]?.product.id, "football");
  assert.equal(results[0]?.breakdown.interests, 1);
});
