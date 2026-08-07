import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { InMemoryTaskManager, TaskStateError } from "./index.js";

async function waitForTerminal(manager: InMemoryTaskManager, taskId: string) {
  for (let index = 0; index < 100; index += 1) {
    const task = manager.get(taskId);
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(task.state)) return task;
    await delay(2);
  }
  throw new Error("La tarea no terminó.");
}

test("crea, encola, publica progreso y completa una tarea", async () => {
  const manager = new InMemoryTaskManager();
  const task = manager.createAndEnqueue({
    type: "story.build",
    input: { title: "Supergemelas" },
    executor: async (input, context) => {
      context.progress({ percent: 25, step: "understand", message: "Entendiendo la idea" });
      await delay(1);
      context.progress({ percent: 75, step: "compose", message: "Creando la historia" });
      return { ok: true, input };
    },
  });
  const completed = await waitForTerminal(manager, task.id);
  assert.equal(completed.state, "COMPLETED");
  assert.equal(completed.progress?.percent, 100);
  assert.equal(manager.events(task.id).some((event) => event.type === "TASK_PROGRESS"), true);
});

test("cancela tareas en ejecución", async () => {
  const manager = new InMemoryTaskManager();
  const task = manager.createAndEnqueue({
    type: "image.generate",
    input: {},
    executor: async (_input, context) => {
      await delay(20, undefined, { signal: context.signal });
      return "never";
    },
  });
  await delay(1);
  const cancelled = manager.cancel(task.id);
  assert.equal(cancelled.state, "CANCELLED");
});

test("reintenta una tarea fallida dentro del máximo configurado", async () => {
  const manager = new InMemoryTaskManager();
  let executions = 0;
  const task = manager.createAndEnqueue({
    type: "unstable",
    input: {},
    maxAttempts: 2,
    executor: async () => {
      executions += 1;
      if (executions === 1) throw new Error("temporal");
      return "ok";
    },
  });
  assert.equal((await waitForTerminal(manager, task.id)).state, "FAILED");
  manager.retry(task.id);
  assert.equal((await waitForTerminal(manager, task.id)).state, "COMPLETED");
  assert.throws(() => manager.retry(task.id), TaskStateError);
});
