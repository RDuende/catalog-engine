import assert from "node:assert/strict";
import test from "node:test";

import type { RcePlannedTask } from "./conversation-planner.contracts.js";
import { RceTaskRuntime } from "./task-runtime.js";
import { taskProgressView } from "./task-runtime-view.js";

function planned(
  id: string,
  type: RcePlannedTask["type"],
  input: Readonly<Record<string, unknown>>,
  priority = 50,
): RcePlannedTask {
  return Object.freeze({
    id,
    type,
    status: "PLANNED",
    priority,
    reason: "test",
    input,
  });
}

test("encola tareas del Conversation Planner por prioridad", () => {
  const runtime = new RceTaskRuntime();

  const result = runtime.plan({
    conversationId: "c1",
    tasks: [
      planned("a", "SEARCH_PRODUCTS", { interest: "football" }, 90),
      planned("b", "SEARCH_TEMPLATES", { interest: "football" }, 60),
    ],
    now: "2026-08-04T12:00:00.000Z",
  });

  assert.equal(result.tasks.length, 2);
  assert.equal(result.tasks[0]?.type, "SEARCH_PRODUCTS");
  assert.equal(result.tasks[0]?.status, "QUEUED");
});

test("no duplica una tarea con la misma entrada", () => {
  const runtime = new RceTaskRuntime();

  runtime.plan({
    conversationId: "c1",
    tasks: [planned("a", "SEARCH_PRODUCTS", { interest: "football" })],
  });

  const result = runtime.plan({
    conversationId: "c1",
    tasks: [planned("b", "SEARCH_PRODUCTS", { interest: "football" })],
  });

  assert.equal(
    result.tasks.filter((task) => task.status !== "SUPERSEDED").length,
    1,
  );
});

test("marca tareas antiguas como superseded cuando cambia el contexto", () => {
  const runtime = new RceTaskRuntime();

  runtime.plan({
    conversationId: "c1",
    tasks: [planned("a", "SEARCH_PRODUCTS", { budget: 30 })],
  });

  const result = runtime.plan({
    conversationId: "c1",
    tasks: [planned("b", "SEARCH_PRODUCTS", { budget: 50 })],
  });

  assert.equal(
    result.tasks.some((task) => task.status === "SUPERSEDED"),
    true,
  );
  assert.equal(
    result.tasks.some(
      (task) =>
        task.status === "QUEUED" &&
        task.input["budget"] === 50,
    ),
    true,
  );
});

test("ejecuta una tarea mediante su handler", async () => {
  const runtime = new RceTaskRuntime();

  runtime.register("SEARCH_PRODUCTS", async ({ task }) => ({
    products: [task.input],
  }));

  runtime.plan({
    conversationId: "c1",
    tasks: [planned("a", "SEARCH_PRODUCTS", { interest: "football" })],
  });

  const result = await runtime.runNext("c1");

  assert.equal(result.tasks[0]?.status, "COMPLETED");
  assert.deepEqual(result.tasks[0]?.result, {
    products: [{ interest: "football" }],
  });
  assert.equal(result.progress.percent, 100);
});

test("expone etapas de progreso para la interfaz", () => {
  const runtime = new RceTaskRuntime();

  const snapshot = runtime.plan({
    conversationId: "c1",
    tasks: [
      planned("a", "SEARCH_PRODUCTS", {}),
      planned("b", "PREPARE_PROPOSALS", {}),
    ],
  });

  const view = taskProgressView(snapshot);

  assert.equal(view.stages.length, 2);
  assert.match(view.stages[0]?.label ?? "", /productos/i);
});
