import type {
  DomainEventHandler,
  DomainEventName,
  EventBus,
  Unsubscribe,
} from "../contracts/services.js";
import type { CatalogDomainEvent, DomainEvent } from "./domain-events.js";

type StoredHandler = DomainEventHandler<DomainEvent>;

export interface InMemoryEventBusOptions {
  /**
   * Ejecuta los handlers en paralelo. Por defecto se ejecutan de forma
   * secuencial para conservar un orden determinista.
   */
  readonly parallelHandlers?: boolean;
}

export class InMemoryEventBus<
  TEvent extends DomainEvent = CatalogDomainEvent,
> implements EventBus<TEvent> {
  private readonly handlers = new Map<string, Set<StoredHandler>>();
  private readonly parallelHandlers: boolean;

  constructor(options: InMemoryEventBusOptions = {}) {
    this.parallelHandlers = options.parallelHandlers ?? false;
  }

  async publish(event: TEvent): Promise<void> {
    const subscribedHandlers = this.handlers.get(event.name);

    if (!subscribedHandlers || subscribedHandlers.size === 0) {
      return;
    }

    // Permite suscribir o cancelar handlers durante la publicación sin alterar
    // la iteración que ya está en curso.
    const handlers = [...subscribedHandlers];

    if (this.parallelHandlers) {
      const results = await Promise.allSettled(
        handlers.map(async (handler) => handler(event)),
      );

      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        )
        .map((result) => result.reason);

      if (errors.length > 0) {
        throw new AggregateError(
          errors,
          `Fallaron ${errors.length} handler(s) del evento "${event.name}".`,
        );
      }

      return;
    }

    for (const handler of handlers) {
      await handler(event);
    }
  }

  async publishMany(events: readonly TEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /** Alias práctico para código que prefiera la denominación publishAll. */
  async publishAll(events: readonly TEvent[]): Promise<void> {
    await this.publishMany(events);
  }

  subscribe<TName extends DomainEventName<TEvent>>(
    eventName: TName,
    handler: DomainEventHandler<Extract<TEvent, { readonly name: TName }>>,
  ): Unsubscribe {
    const handlers = this.handlers.get(eventName) ?? new Set<StoredHandler>();
    const storedHandler = handler as unknown as StoredHandler;

    handlers.add(storedHandler);
    this.handlers.set(eventName, handlers);

    let active = true;

    return () => {
      if (!active) {
        return;
      }

      active = false;
      const currentHandlers = this.handlers.get(eventName);

      if (!currentHandlers) {
        return;
      }

      currentHandlers.delete(storedHandler);

      if (currentHandlers.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }

  clear(eventName?: DomainEventName<TEvent>): void {
    if (eventName === undefined) {
      this.handlers.clear();
      return;
    }

    this.handlers.delete(eventName);
  }

  subscriberCount(eventName?: DomainEventName<TEvent>): number {
    if (eventName !== undefined) {
      return this.handlers.get(eventName)?.size ?? 0;
    }

    let total = 0;

    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }

    return total;
  }
}
