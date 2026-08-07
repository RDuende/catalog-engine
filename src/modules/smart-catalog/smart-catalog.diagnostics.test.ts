import assert from "node:assert/strict";
import test from "node:test";

import { InMemorySmartCatalogRepository } from "./in-memory-smart-catalog.repository.js";
import { SmartCatalogService } from "./smart-catalog.service.js";

test("expone el embudo y los motivos de descarte", async () => {
  const service = new SmartCatalogService(
    new InMemorySmartCatalogRepository([
      {
        id: "cook-mug",
        sku: "COOK-1",
        name: "Taza para amantes de la cocina",
        category: "DRINKWARE",
        price: 15,
        cost: 5,
        currency: "EUR",
        stock: 10,
        productionDays: 2,
        tags: ["cocina", "chef"],
        emotionalGoals: [],
        visualStyles: [],
        presentationTemplateIds: [],
        active: true,
      },
      {
        id: "football-keyring",
        sku: "FOOT-1",
        name: "Llavero balón",
        category: "KEYRING",
        price: 8,
        cost: 2,
        currency: "EUR",
        stock: 10,
        productionDays: 2,
        tags: ["fútbol", "balón"],
        emotionalGoals: [],
        visualStyles: [],
        presentationTemplateIds: [],
        active: true,
      },
      {
        id: "inactive-cook",
        sku: "COOK-2",
        name: "Delantal de cocina",
        category: "TEXTILE",
        price: 18,
        cost: 7,
        currency: "EUR",
        stock: 10,
        productionDays: 2,
        tags: ["cocina"],
        emotionalGoals: [],
        visualStyles: [],
        presentationTemplateIds: [],
        active: false,
      },
    ]),
  );

  const result = await service.diagnose(
    { interests: ["cooking"] },
    12,
  );

  assert.equal(result.catalogSize, 3);
  assert.equal(result.scopedCount, 3);
  assert.equal(result.activeCount, 2);
  assert.equal(result.selectedCount, 1);
  assert.equal(
    result.recommendations[0]?.product.id,
    "cook-mug",
  );
  assert.equal(
    result.discarded.some(
      (item) =>
        item.product.id === "football-keyring" &&
        item.reason ===
          "INTEREST_AFFINITY_TOO_LOW",
    ),
    true,
  );
  assert.equal(
    result.discarded.some(
      (item) =>
        item.product.id === "inactive-cook" &&
        item.reason === "INACTIVE",
    ),
    true,
  );
});

test("recommend conserva el contrato anterior", async () => {
  const service = new SmartCatalogService(
    new InMemorySmartCatalogRepository(),
  );

  const recommendations = await service.recommend(
    { interests: ["fútbol"] },
    3,
  );

  assert.equal(Array.isArray(recommendations), true);
  assert.equal(recommendations.length <= 3, true);
});
