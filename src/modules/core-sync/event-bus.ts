import { randomUUID } from "node:crypto";
import type { CoreSyncEvent } from "./core-sync-types.js";

export type EventHandler<TPayload = unknown> = (event: CoreSyncEvent<TPayload>) => void | Promise<void>;

export class CoreSyncEventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  on<TPayload = unknown>(type: string, handler: EventHandler<TPayload>): () => void {
    const handlers = this.handlers.get(type) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.handlers.set(type, handlers);
    return () => handlers.delete(handler as EventHandler);
  }

  async emit<TPayload>(type: string, payload: TPayload, jobId?: string): Promise<CoreSyncEvent<TPayload>> {
    const event: CoreSyncEvent<TPayload> = {
      id: randomUUID(),
      type,
      occurredAt: new Date().toISOString(),
      jobId,
      payload,
    };
    const handlers = [...(this.handlers.get(type) ?? []), ...(this.handlers.get("*") ?? [])];
    await Promise.allSettled(handlers.map(handler => handler(event)));
    return event;
  }
}

export const coreSyncEventBus = new CoreSyncEventBus();
