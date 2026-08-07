import { randomUUID } from "node:crypto";
import type {
  CreateTaskInput,
  ManagedTask,
  TaskEvent,
  TaskEventType,
  TaskEventListener,
  TaskEventSubscription,
  TaskExecutor,
  TaskProgress,
} from "./task.types.js";

interface InternalTask {
  task: ManagedTask;
  executor: TaskExecutor<unknown, unknown>;
  controller: AbortController;
}

export class TaskNotFoundError extends Error {
  readonly code = "TASK_NOT_FOUND";
  constructor(readonly taskId: string) {
    super(`No existe la tarea ${taskId}.`);
    this.name = "TaskNotFoundError";
  }
}

export class TaskStateError extends Error {
  readonly code = "TASK_STATE_INVALID";
  constructor(readonly taskId: string, message: string) {
    super(message);
    this.name = "TaskStateError";
  }
}

export class InMemoryTaskManager {
  private readonly tasks = new Map<string, InternalTask>();
  private readonly eventLog = new Map<string, TaskEvent[]>();
  private readonly listeners = new Map<string, Set<TaskEventListener>>();
  private sequence = 0;

  create<TInput, TResult>(input: CreateTaskInput<TInput, TResult>): ManagedTask<TInput, TResult> {
    const now = new Date().toISOString();
    const task: ManagedTask<TInput, TResult> = Object.freeze({
      id: randomUUID(),
      type: input.type,
      capabilityId: input.capabilityId,
      correlationId: input.correlationId,
      state: "CREATED",
      input: input.input,
      attempts: 0,
      maxAttempts: Math.max(1, input.maxAttempts ?? 1),
      cancellable: input.cancellable ?? true,
      createdAt: now,
      updatedAt: now,
    });
    this.tasks.set(task.id, {
      task,
      executor: input.executor as TaskExecutor<unknown, unknown>,
      controller: new AbortController(),
    });
    this.emit(task.id, "TASK_CREATED", task);
    return task;
  }

  enqueue<TInput = unknown, TResult = unknown>(taskId: string): ManagedTask<TInput, TResult> {
    const internal = this.require(taskId);
    if (!["CREATED", "FAILED"].includes(internal.task.state)) {
      throw new TaskStateError(taskId, `La tarea ${taskId} no puede encolarse desde ${internal.task.state}.`);
    }
    const previousState = internal.task.state;
    internal.controller = new AbortController();
    this.update(taskId, { state: "QUEUED" });
    this.emit(taskId, previousState === "FAILED" ? "TASK_RETRYING" : "TASK_QUEUED", this.require(taskId).task);
    queueMicrotask(() => void this.execute(taskId));
    return this.get<TInput, TResult>(taskId);
  }

  createAndEnqueue<TInput, TResult>(input: CreateTaskInput<TInput, TResult>): ManagedTask<TInput, TResult> {
    return this.enqueue(this.create(input).id);
  }

  get<TInput = unknown, TResult = unknown>(taskId: string): ManagedTask<TInput, TResult> {
    return this.require(taskId).task as ManagedTask<TInput, TResult>;
  }

  list(): readonly ManagedTask[] {
    return Object.freeze([...this.tasks.values()].map(({ task }) => task));
  }

  events(taskId: string, afterSequence = 0): readonly TaskEvent[] {
    this.require(taskId);
    return Object.freeze((this.eventLog.get(taskId) ?? []).filter((event) => event.sequence > afterSequence));
  }


  subscribe(taskId: string, listener: TaskEventListener, afterSequence = 0): TaskEventSubscription {
    this.require(taskId);
    for (const event of this.events(taskId, afterSequence)) listener(event);
    const listeners = this.listeners.get(taskId) ?? new Set<TaskEventListener>();
    listeners.add(listener);
    this.listeners.set(taskId, listeners);
    let active = true;
    return Object.freeze({
      unsubscribe: () => {
        if (!active) return;
        active = false;
        listeners.delete(listener);
        if (listeners.size === 0) this.listeners.delete(taskId);
      },
    });
  }

  cancel(taskId: string): ManagedTask {
    const internal = this.require(taskId);
    if (!internal.task.cancellable) throw new TaskStateError(taskId, `La tarea ${taskId} no admite cancelación.`);
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(internal.task.state)) {
      throw new TaskStateError(taskId, `La tarea ${taskId} ya está finalizada.`);
    }
    internal.controller.abort();
    this.update(taskId, { state: "CANCELLED", completedAt: new Date().toISOString() });
    this.emit(taskId, "TASK_CANCELLED", this.require(taskId).task);
    return this.get(taskId);
  }

  retry(taskId: string): ManagedTask {
    const task = this.get(taskId);
    if (task.state !== "FAILED") throw new TaskStateError(taskId, `Solo se pueden reintentar tareas fallidas.`);
    if (task.attempts >= task.maxAttempts) throw new TaskStateError(taskId, `La tarea ${taskId} agotó sus reintentos.`);
    return this.enqueue(taskId);
  }

  private async execute(taskId: string): Promise<void> {
    const internal = this.require(taskId);
    if (internal.task.state !== "QUEUED") return;
    const startedAt = new Date().toISOString();
    this.update(taskId, { state: "RUNNING", attempts: internal.task.attempts + 1, startedAt });
    this.emit(taskId, "TASK_STARTED", this.require(taskId).task);
    try {
      const result = await internal.executor(internal.task.input, {
        taskId,
        attempt: this.require(taskId).task.attempts,
        signal: internal.controller.signal,
        progress: (progress) => this.reportProgress(taskId, progress),
      });
      if (internal.controller.signal.aborted) return;
      this.update(taskId, { state: "COMPLETED", result, completedAt: new Date().toISOString(), progress: { percent: 100, message: "Completada" } });
      this.emit(taskId, "TASK_COMPLETED", this.require(taskId).task);
    } catch (error) {
      if (internal.controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      this.update(taskId, { state: "FAILED", error: message, completedAt: new Date().toISOString() });
      this.emit(taskId, "TASK_FAILED", this.require(taskId).task);
    }
  }

  private reportProgress(taskId: string, progress: TaskProgress): void {
    const task = this.get(taskId);
    if (task.state !== "RUNNING" && task.state !== "WAITING") return;
    const percent = progress.percent === undefined ? undefined : Math.max(0, Math.min(100, progress.percent));
    this.update(taskId, { progress: { ...progress, percent } });
    this.emit(taskId, "TASK_PROGRESS", this.require(taskId).task);
  }

  private update(taskId: string, patch: Partial<ManagedTask>): void {
    const internal = this.require(taskId);
    internal.task = Object.freeze({ ...internal.task, ...patch, updatedAt: new Date().toISOString() });
  }

  private emit(taskId: string, type: TaskEventType, task: ManagedTask): void {
    const event: TaskEvent = Object.freeze({
      sequence: ++this.sequence,
      taskId,
      type,
      occurredAt: new Date().toISOString(),
      state: task.state,
      progress: task.progress,
      result: task.result,
      error: task.error,
    });
    const events = this.eventLog.get(taskId) ?? [];
    events.push(event);
    this.eventLog.set(taskId, events);
    for (const listener of this.listeners.get(taskId) ?? []) listener(event);
  }

  private require(taskId: string): InternalTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new TaskNotFoundError(taskId);
    return task;
  }
}
