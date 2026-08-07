import { randomUUID } from "node:crypto";

import type { RcePlannedTask } from "./conversation-planner.contracts.js";
import type {
  RceRuntimeTask,
  RceTaskHandler,
  RceTaskRuntimePlanInput,
  RceTaskRuntimeSnapshot,
} from "./task-runtime.contracts.js";
import { taskFingerprint } from "./task-fingerprint.js";

function progress(tasks: readonly RceRuntimeTask[]) {
  const total = tasks.filter((task) => task.status !== "SUPERSEDED").length;
  const queued = tasks.filter((task) => task.status === "QUEUED").length;
  const running = tasks.filter((task) => task.status === "RUNNING").length;
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  const failed = tasks.filter((task) => task.status === "FAILED").length;
  const terminal = completed + failed;

  return Object.freeze({
    total,
    queued,
    running,
    completed,
    failed,
    percent: total === 0 ? 100 : Math.round((terminal / total) * 100),
  });
}

function snapshot(
  conversationId: string,
  tasks: readonly RceRuntimeTask[],
  now: string,
): RceTaskRuntimeSnapshot {
  return Object.freeze({
    conversationId,
    tasks: Object.freeze([...tasks]),
    progress: progress(tasks),
    updatedAt: now,
  });
}

export class RceTaskRuntime {
  readonly #handlers = new Map<RceRuntimeTask["type"], RceTaskHandler>();
  readonly #tasks = new Map<string, RceRuntimeTask[]>();

  register(type: RceRuntimeTask["type"], handler: RceTaskHandler): void {
    this.#handlers.set(type, handler);
  }

  plan(input: RceTaskRuntimePlanInput): RceTaskRuntimeSnapshot {
    const now = input.now ?? new Date().toISOString();
    const current = [...(this.#tasks.get(input.conversationId) ?? [])];
    const plannedFingerprints = new Set(
      input.tasks
        .filter((task) => task.status === "PLANNED" && task.type !== "NOOP")
        .map(taskFingerprint),
    );

    const updated = current.map((task): RceRuntimeTask => {
      if (
        (task.status === "QUEUED" || task.status === "RUNNING") &&
        !plannedFingerprints.has(task.fingerprint)
      ) {
        return Object.freeze({
          ...task,
          status: "SUPERSEDED",
          updatedAt: now,
        });
      }

      return task;
    });

    for (const planned of input.tasks) {
      if (planned.status !== "PLANNED" || planned.type === "NOOP") {
        continue;
      }

      const fingerprint = taskFingerprint(planned);
      const existing = updated.find(
        (task) =>
          task.fingerprint === fingerprint &&
          task.status !== "FAILED" &&
          task.status !== "CANCELLED" &&
          task.status !== "SUPERSEDED",
      );

      if (existing) {
        continue;
      }

      updated.push(
        Object.freeze({
          id: randomUUID(),
          conversationId: input.conversationId,
          planTaskId: planned.id,
          type: planned.type,
          status: "QUEUED",
          priority: planned.priority,
          reason: planned.reason,
          input: planned.input,
          fingerprint,
          createdAt: now,
          updatedAt: now,
          attempts: 0,
        }),
      );
    }

    updated.sort((left, right) => {
      if (left.status !== right.status) {
        if (left.status === "QUEUED") return -1;
        if (right.status === "QUEUED") return 1;
      }

      return right.priority - left.priority;
    });

    this.#tasks.set(input.conversationId, updated);
    return snapshot(input.conversationId, updated, now);
  }

  get(
    conversationId: string,
    now = new Date().toISOString(),
  ): RceTaskRuntimeSnapshot {
    return snapshot(
      conversationId,
      this.#tasks.get(conversationId) ?? [],
      now,
    );
  }

  async runNext(
    conversationId: string,
    now = new Date().toISOString(),
  ): Promise<RceTaskRuntimeSnapshot> {
    const tasks = [...(this.#tasks.get(conversationId) ?? [])];
    const index = tasks.findIndex((task) => task.status === "QUEUED");

    if (index < 0) {
      return snapshot(conversationId, tasks, now);
    }

    const selected = tasks[index];
    if (!selected) {
      return snapshot(conversationId, tasks, now);
    }

    const handler = this.#handlers.get(selected.type);

    if (!handler) {
      tasks[index] = Object.freeze({
        ...selected,
        status: "FAILED",
        attempts: selected.attempts + 1,
        error: `No existe handler para ${selected.type}.`,
        updatedAt: now,
      });
      this.#tasks.set(conversationId, tasks);
      return snapshot(conversationId, tasks, now);
    }

    const running: RceRuntimeTask = Object.freeze({
      ...selected,
      status: "RUNNING",
      attempts: selected.attempts + 1,
      updatedAt: now,
    });

    tasks[index] = running;
    this.#tasks.set(conversationId, tasks);

    try {
      const result = await handler({ task: running });

      tasks[index] = Object.freeze({
        ...running,
        status: "COMPLETED",
        result,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      tasks[index] = Object.freeze({
        ...running,
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
        updatedAt: new Date().toISOString(),
      });
    }

    this.#tasks.set(conversationId, tasks);
    return snapshot(
      conversationId,
      tasks,
      tasks[index]?.updatedAt ?? now,
    );
  }

  cancel(
    conversationId: string,
    taskId: string,
    now = new Date().toISOString(),
  ): RceTaskRuntimeSnapshot {
    const tasks = [...(this.#tasks.get(conversationId) ?? [])];
    const index = tasks.findIndex((task) => task.id === taskId);

    if (index >= 0) {
      const task = tasks[index];
      if (task && (task.status === "QUEUED" || task.status === "RUNNING")) {
        tasks[index] = Object.freeze({
          ...task,
          status: "CANCELLED",
          updatedAt: now,
        });
      }
    }

    this.#tasks.set(conversationId, tasks);
    return snapshot(conversationId, tasks, now);
  }
}
