import type { FastifyInstance } from "fastify";
import type { InMemoryTaskManager } from "./task-manager.js";
import { TaskNotFoundError, TaskStateError } from "./task-manager.js";
import {
  isTerminalTaskEvent,
  serializeTaskEvent,
  serializeTaskHeartbeat,
  TASK_STREAM_HEARTBEAT_MS,
} from "./task-stream.js";

function sequenceFromRequest(headers: Record<string, unknown>, queryAfter?: string): number {
  const header = headers["last-event-id"];
  const raw = typeof header === "string" ? header : queryAfter;
  const sequence = Number(raw ?? 0);
  return Number.isFinite(sequence) && sequence >= 0 ? sequence : 0;
}

export async function taskManagerRoutes(app: FastifyInstance, manager: InMemoryTaskManager) {
  app.get("/tasks", async () => manager.list());
  app.get<{ Params: { taskId: string } }>("/tasks/:taskId", async (request, reply) => {
    try { return manager.get(request.params.taskId); }
    catch (error) { if (error instanceof TaskNotFoundError) return reply.code(404).send({ error: error.code, message: error.message }); throw error; }
  });
  app.get<{ Params: { taskId: string }; Querystring: { after?: string } }>("/tasks/:taskId/events", async (request, reply) => {
    try { return manager.events(request.params.taskId, Number(request.query.after ?? 0)); }
    catch (error) { if (error instanceof TaskNotFoundError) return reply.code(404).send({ error: error.code, message: error.message }); throw error; }
  });
  app.get<{ Params: { taskId: string }; Querystring: { after?: string } }>("/tasks/:taskId/stream", async (request, reply) => {
    const taskId = request.params.taskId;
    try { manager.get(taskId); }
    catch (error) { if (error instanceof TaskNotFoundError) return reply.code(404).send({ error: error.code, message: error.message }); throw error; }

    reply.hijack();
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    reply.raw.flushHeaders?.();

    const afterSequence = sequenceFromRequest(request.headers as Record<string, unknown>, request.query.after);
    let closed = false;
    let subscription: ReturnType<InMemoryTaskManager["subscribe"]> | undefined;
    let heartbeat: NodeJS.Timeout | undefined;

    const close = () => {
      if (closed) return;
      closed = true;
      subscription?.unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
      if (!reply.raw.destroyed && !reply.raw.writableEnded) reply.raw.end();
    };

    request.raw.once("close", close);

    const pending = manager.events(taskId, afterSequence);
    for (const event of pending) reply.raw.write(serializeTaskEvent(event));
    const lastPending = pending.at(-1);
    if (lastPending && isTerminalTaskEvent(lastPending)) {
      close();
      return;
    }

    const resumeAfter = lastPending?.sequence ?? afterSequence;
    subscription = manager.subscribe(taskId, (event) => {
      if (closed || reply.raw.destroyed || reply.raw.writableEnded) return;
      reply.raw.write(serializeTaskEvent(event));
      if (isTerminalTaskEvent(event)) close();
    }, resumeAfter);

    if (!closed) {
      heartbeat = setInterval(() => {
        if (!closed && !reply.raw.destroyed && !reply.raw.writableEnded) {
          reply.raw.write(serializeTaskHeartbeat());
        }
      }, TASK_STREAM_HEARTBEAT_MS);
      heartbeat.unref();
    }
  });
  app.post<{ Params: { taskId: string } }>("/tasks/:taskId/cancel", async (request, reply) => {
    try { return manager.cancel(request.params.taskId); }
    catch (error) { if (error instanceof TaskNotFoundError) return reply.code(404).send({ error: error.code, message: error.message }); if (error instanceof TaskStateError) return reply.code(409).send({ error: error.code, message: error.message }); throw error; }
  });
  app.post<{ Params: { taskId: string } }>("/tasks/:taskId/retry", async (request, reply) => {
    try { return manager.retry(request.params.taskId); }
    catch (error) { if (error instanceof TaskNotFoundError) return reply.code(404).send({ error: error.code, message: error.message }); if (error instanceof TaskStateError) return reply.code(409).send({ error: error.code, message: error.message }); throw error; }
  });
}
