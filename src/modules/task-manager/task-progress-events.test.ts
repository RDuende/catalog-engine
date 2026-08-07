import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { InMemoryTaskManager } from "./task-manager.js";
import { isTerminalTaskEvent, serializeTaskEvent, serializeTaskHeartbeat } from "./task-stream.js";
import type { TaskEvent } from "./task.types.js";

async function waitForTerminal(manager: InMemoryTaskManager, taskId: string) {
  for (let index = 0; index < 100; index += 1) {
    const task = manager.get(taskId);
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(task.state)) return task;
    await delay(2);
  }
  throw new Error("La tarea no terminó.");
}

test("subscribe reproduce eventos pendientes y publica los nuevos en orden", async () => {
  const manager = new InMemoryTaskManager();
  const task = manager.create({
    type: "story.build",
    input: {},
    executor: async (_input, context) => {
      context.progress({ percent: 50, step: "compose", message: "Componiendo" });
      return { ok: true };
    },
  });
  const received: TaskEvent[] = [];
  const subscription = manager.subscribe(task.id, (event) => received.push(event));
  manager.enqueue(task.id);
  await waitForTerminal(manager, task.id);
  subscription.unsubscribe();
  assert.deepEqual(received.map((event) => event.type), [
    "TASK_CREATED",
    "TASK_QUEUED",
    "TASK_STARTED",
    "TASK_PROGRESS",
    "TASK_COMPLETED",
  ]);
  assert.equal(received.every((event, index) => index === 0 || event.sequence > received[index - 1]!.sequence), true);
});

test("subscribe reanuda desde una secuencia concreta", () => {
  const manager = new InMemoryTaskManager();
  const task = manager.create({ type: "resume", input: {}, executor: async () => "ok" });
  const created = manager.events(task.id)[0]!;
  const received: TaskEvent[] = [];
  const subscription = manager.subscribe(task.id, (event) => received.push(event), created.sequence);
  assert.equal(received.length, 0);
  subscription.unsubscribe();
});

test("serializa eventos SSE, heartbeat y terminales", () => {
  const event: TaskEvent = {
    sequence: 12,
    taskId: "task-1",
    type: "TASK_COMPLETED",
    occurredAt: "2026-08-02T00:00:00.000Z",
    state: "COMPLETED",
    result: { ok: true },
  };
  const serialized = serializeTaskEvent(event);
  assert.match(serialized, /^id: 12/m);
  assert.match(serialized, /^event: task_completed/m);
  assert.match(serialized, /^data: /m);
  assert.equal(serialized.endsWith("\n\n"), true);
  assert.equal(serializeTaskHeartbeat("now"), ": heartbeat now\n\n");
  assert.equal(isTerminalTaskEvent(event), true);
});
