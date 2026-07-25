import type { DomainEvent } from "../../core/events/domain-events.js";
import { entityId } from "../../core/shared/ids.js";

function eventId(): string {
  return globalThis.crypto.randomUUID();
}

export function knowledgeProductBuiltEvent(payload: {
  productId: string;
  nodes: number;
  links: number;
}): DomainEvent<"knowledge.product-built", typeof payload> {
  return {
    id: eventId(),
    name: "knowledge.product-built",
    occurredAt: new Date(),
    aggregateId: entityId(payload.productId),
    payload
  };
}

export function knowledgeCatalogBuiltEvent(payload: {
  productsProcessed: number;
  productsFailed: number;
  nodes: number;
  links: number;
}): DomainEvent<"knowledge.catalog-built", typeof payload> {
  return {
    id: eventId(),
    name: "knowledge.catalog-built",
    occurredAt: new Date(),
    payload
  };
}
