import type { TaskEvent } from "./task.types.js";

export const TASK_STREAM_HEARTBEAT_MS = 15_000;

export function serializeTaskEvent(event: TaskEvent): string {
  return [
    `id: ${event.sequence}`,
    `event: ${event.type.toLowerCase()}`,
    `data: ${JSON.stringify(event)}`,
    "",
    "",
  ].join("\n");
}

export function serializeTaskHeartbeat(now = new Date().toISOString()): string {
  return `: heartbeat ${now}\n\n`;
}

export function isTerminalTaskEvent(event: TaskEvent): boolean {
  return ["TASK_COMPLETED", "TASK_FAILED", "TASK_CANCELLED"].includes(event.type);
}
