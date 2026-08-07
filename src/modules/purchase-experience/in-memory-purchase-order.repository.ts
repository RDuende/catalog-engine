import type { PurchaseOrder, PurchaseOrderRepository } from "./purchase-experience.types.js";

export class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly orders = new Map<string, PurchaseOrder>();

  save(order: PurchaseOrder): PurchaseOrder {
    this.orders.set(order.id, order);
    return order;
  }

  getById(id: string): PurchaseOrder | undefined {
    return this.orders.get(id);
  }

  listByJourney(journeyId: string): readonly PurchaseOrder[] {
    return [...this.orders.values()]
      .filter((order) => order.journeyId === journeyId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}
