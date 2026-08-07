import assert from "node:assert/strict";
import test from "node:test";

import type {
  RceProductRankingPort,
  RceProductSearchPort,
} from "./product-runtime.contracts.js";
import { RceProductRuntime } from "./product-runtime.js";
import { registerProductRuntimeHandlers } from "./product-runtime-adapter.js";
import { RceTaskRuntime } from "./task-runtime.js";

const searchPort: RceProductSearchPort = {
  async search(criteria) {
    return [
      {
        id: "ball",
        title: "Balón personalizado",
        price: 20,
        available: true,
        metadata: { criteria },
      },
      {
        id: "shirt",
        title: "Camiseta personalizada",
        price: 25,
        available: true,
      },
    ];
  },
};

const rankingPort: RceProductRankingPort = {
  async rank({ candidates }) {
    return candidates.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      score: 100 - index * 10,
      reasons: ["Compatible con los intereses"],
    }));
  },
};

function planned(
  id: string,
  type: "SEARCH_PRODUCTS" | "RANK_PRODUCTS",
  input: Readonly<Record<string, unknown>>,
) {
  return Object.freeze({
    id,
    type,
    status: "PLANNED" as const,
    priority: type === "SEARCH_PRODUCTS" ? 90 : 80,
    reason: "test",
    input,
  });
}

test("SEARCH_PRODUCTS ejecuta el puerto y guarda resultado", async () => {
  const tasks = new RceTaskRuntime();
  const products = new RceProductRuntime({
    searchPort,
    rankingPort,
  });

  registerProductRuntimeHandlers(tasks, products);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("search-1", "SEARCH_PRODUCTS", {
        "recipient.interests": ["football"],
        "budget.max": 30,
      }),
    ],
  });

  const result = await tasks.runNext("c1");
  const payload = result.tasks[0]?.result as {
    readonly result?: {
      readonly candidates?: readonly unknown[];
    };
  };

  assert.equal(result.tasks[0]?.status, "COMPLETED");
  assert.equal(payload.result?.candidates?.length, 2);
  assert.equal(products.metrics().searches, 1);
});

test("reutiliza una búsqueda idéntica desde caché", async () => {
  const tasks = new RceTaskRuntime();
  const products = new RceProductRuntime({
    searchPort,
    rankingPort,
  });

  registerProductRuntimeHandlers(tasks, products);

  const input = {
    "recipient.interests": ["football"],
    "budget.max": 30,
  };

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("search-1", "SEARCH_PRODUCTS", input)],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c2",
    tasks: [planned("search-2", "SEARCH_PRODUCTS", input)],
  });
  await tasks.runNext("c2");

  assert.equal(products.metrics().searches, 1);
  assert.equal(products.metrics().cacheHits, 1);
});

test("cambiar presupuesto produce una nueva búsqueda", async () => {
  const tasks = new RceTaskRuntime();
  const products = new RceProductRuntime({
    searchPort,
    rankingPort,
  });

  registerProductRuntimeHandlers(tasks, products);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("search-1", "SEARCH_PRODUCTS", {
        "recipient.interests": ["football"],
        "budget.max": 30,
      }),
    ],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("search-2", "SEARCH_PRODUCTS", {
        "recipient.interests": ["football"],
        "budget.max": 50,
      }),
    ],
  });
  await tasks.runNext("c1");

  assert.equal(products.metrics().searches, 2);
});

test("RANK_PRODUCTS usa la búsqueda compatible en caché", async () => {
  const tasks = new RceTaskRuntime();
  const products = new RceProductRuntime({
    searchPort,
    rankingPort,
  });

  registerProductRuntimeHandlers(tasks, products);

  const input = {
    "recipient.interests": ["football"],
    "budget.max": 30,
  };

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("search", "SEARCH_PRODUCTS", input)],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("rank", "RANK_PRODUCTS", input)],
  });
  await tasks.runNext("c1");

  const snapshot = tasks.get("c1");
  const rankingTask = snapshot.tasks.find(
    (task) => task.type === "RANK_PRODUCTS",
  );

  assert.equal(rankingTask?.status, "COMPLETED");
  assert.equal(products.metrics().rankings, 1);
});

test("un fallo del puerto no rompe el runtime", async () => {
  const tasks = new RceTaskRuntime();
  const products = new RceProductRuntime({
    searchPort: {
      async search() {
        throw new Error("catalog unavailable");
      },
    },
    rankingPort,
  });

  registerProductRuntimeHandlers(tasks, products);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("search", "SEARCH_PRODUCTS", {
        "recipient.interests": ["football"],
      }),
    ],
  });

  const result = await tasks.runNext("c1");

  assert.equal(result.tasks[0]?.status, "FAILED");
  assert.match(result.tasks[0]?.error ?? "", /catalog unavailable/);
  assert.equal(products.metrics().failures, 1);
});
