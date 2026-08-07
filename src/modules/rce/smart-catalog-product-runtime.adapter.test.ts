import assert from "node:assert/strict";
import test from "node:test";

import {
  SmartCatalogProductRankingAdapter,
  SmartCatalogProductSearchAdapter,
  toSmartCatalogContext,
  type SmartCatalogContextLike,
  type SmartCatalogServiceLike,
} from "./smart-catalog-product-runtime.adapter.js";
import {
  registerSmartCatalogProductRuntime,
} from "./smart-catalog-product-runtime.bootstrap.js";
import { RceTaskRuntime } from "./task-runtime.js";

test("traduce criterios RCE al contexto de Smart Catalog", () => {
  const context = toSmartCatalogContext({
    relationship: "nephew",
    age: 10,
    occasion: "birthday",
    interests: ["football"],
    budgetMax: 30,
    style: ["fun"],
    limit: 20,
  });

  assert.deepEqual(context, {
    interests: ["football"],
    recipientAge: 10,
    budget: 30,
    visualStyle: "fun",
    requiredQuantity: 1,
  });
});

test("convierte recomendaciones reales en candidatos RCE", async () => {
  let received: SmartCatalogContextLike | undefined;

  const service: SmartCatalogServiceLike = {
    async recommend(context) {
      received = context;

      return [
        {
          product: {
            id: "ball",
            sku: "BALL-1",
            name: "Balón personalizado",
            price: 20,
            currency: "EUR",
            stock: 4,
            active: true,
            category: "SPORT",
            imageUrl: "/media/ball.jpg",
          },
          score: 91,
          available: true,
          withinBudget: true,
          marginAmount: 8,
          marginPercent: 40,
          reasons: ["Relacionado con fútbol."],
          warnings: [],
          breakdown: {
            interests: 1,
            availability: 1,
          },
        },
      ];
    },
  };

  const adapter = new SmartCatalogProductSearchAdapter(
    service,
  );

  const result = await adapter.search({
    interests: ["football"],
    age: 10,
    budgetMax: 30,
    limit: 10,
  });

  assert.equal(received?.budget, 30);
  assert.equal(received?.recipientAge, 10);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "ball");
  assert.equal(result[0]?.score, 91);
  assert.equal(result[0]?.metadata?.["sku"], "BALL-1");
  assert.equal(
    result[0]?.metadata?.["withinBudget"],
    true,
  );
});

test("ranking conserva score y razones de Smart Catalog", async () => {
  const ranking = new SmartCatalogProductRankingAdapter();

  const result = await ranking.rank({
    criteria: {
      interests: ["football"],
      budgetMax: 30,
    },
    candidates: [
      {
        id: "shirt",
        title: "Camiseta",
        price: 25,
        available: true,
        score: 80,
        reasons: ["Personalizable"],
      },
      {
        id: "ball",
        title: "Balón",
        price: 20,
        available: true,
        score: 95,
        reasons: ["Afinidad directa"],
      },
    ],
  });

  assert.equal(result[0]?.id, "ball");
  assert.equal(result[0]?.rank, 1);
  assert.equal(result[0]?.score, 95);
  assert.match(
    result[0]?.reasons.join(" ") ?? "",
    /presupuesto/i,
  );
});

test("bootstrap registra SEARCH_PRODUCTS y RANK_PRODUCTS", async () => {
  const taskRuntime = new RceTaskRuntime();

  const smartCatalog: SmartCatalogServiceLike = {
    async recommend() {
      return [
        {
          product: {
            id: "mug",
            name: "Taza personalizada",
            price: 14,
            stock: 10,
            active: true,
          },
          score: 75,
          available: true,
          reasons: ["Producto personalizable"],
        },
      ];
    },
  };

  const bootstrap = registerSmartCatalogProductRuntime({
    taskRuntime,
    smartCatalog,
  });

  taskRuntime.plan({
    conversationId: "conversation-1",
    tasks: [
      {
        id: "search-1",
        type: "SEARCH_PRODUCTS",
        status: "PLANNED",
        priority: 90,
        reason: "test",
        input: {
          "recipient.interests": ["football"],
          "budget.max": 30,
        },
      },
    ],
  });

  const snapshot = await taskRuntime.runNext(
    "conversation-1",
  );

  assert.equal(snapshot.tasks[0]?.status, "COMPLETED");
  assert.equal(
    bootstrap.productRuntime.metrics().searches,
    1,
  );
});
