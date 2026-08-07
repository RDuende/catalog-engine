import { randomUUID } from "node:crypto";
import type { SmartCatalogRepository } from "../smart-catalog/smart-catalog.types.js";
import { PurchaseOrderNotFoundError, PurchaseOrderStateError, PurchaseOrderValidationError } from "./purchase-experience.errors.js";
import type { CreatePurchaseOrderInput, PurchaseOrder, PurchaseOrderLine, PurchaseOrderRepository, PurchaseOrderTotals } from "./purchase-experience.types.js";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotals(lines: readonly PurchaseOrderLine[]): PurchaseOrderTotals {
  const currency = lines[0]?.currency ?? "EUR";
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const shipping = subtotal >= 50 ? 0 : 4.95;
  const tax = 0; // Los precios del catálogo se consideran IVA incluido en esta fase.
  return Object.freeze({ subtotal, shipping, tax, total: roundMoney(subtotal + shipping + tax), currency });
}

export class PurchaseExperienceService {
  constructor(
    private readonly orders: PurchaseOrderRepository,
    private readonly catalog: SmartCatalogRepository,
  ) {}

  create(input: CreatePurchaseOrderInput): PurchaseOrder {
    const journeyId = input.journeyId.trim();
    if (!journeyId) throw new PurchaseOrderValidationError("journeyId es obligatorio.");
    if (input.lines.length === 0) throw new PurchaseOrderValidationError("El pedido debe contener al menos una línea.");

    const lines = input.lines.map((requested): PurchaseOrderLine => {
      if (!Number.isInteger(requested.quantity) || requested.quantity <= 0) {
        throw new PurchaseOrderValidationError(`La cantidad de ${requested.productId} debe ser un entero positivo.`);
      }
      const product = this.catalog.getById(requested.productId);
      if (!product || !product.active) throw new PurchaseOrderValidationError(`El producto ${requested.productId} no está disponible.`);
      if (product.stock < requested.quantity) throw new PurchaseOrderValidationError(`No hay stock suficiente de ${product.name}.`);

      const base: PurchaseOrderLine = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: requested.quantity,
        unitPrice: product.price,
        lineTotal: roundMoney(product.price * requested.quantity),
        currency: product.currency,
      };
      return Object.freeze({
        ...base,
        ...(requested.presentationArtifactId
          ? { presentationArtifactId: requested.presentationArtifactId }
          : {}),
        ...(requested.purchaseIntentArtifactId
          ? { purchaseIntentArtifactId: requested.purchaseIntentArtifactId }
          : {}),
        ...(requested.workspaceArtifactIds?.length
          ? { workspaceArtifactIds: Object.freeze([...requested.workspaceArtifactIds]) }
          : {}),
        ...(requested.proposalId
          ? { proposalId: requested.proposalId }
          : {}),
      });
    });

    const currencies = new Set(lines.map((line) => line.currency));
    if (currencies.size !== 1) throw new PurchaseOrderValidationError("Todas las líneas deben usar la misma moneda.");

    const now = new Date().toISOString();
    const order: PurchaseOrder = Object.freeze({
      id: randomUUID(),
      journeyId,
      status: "DRAFT",
      lines: Object.freeze(lines),
      totals: calculateTotals(lines),
      createdAt: now,
      updatedAt: now,
    });
    return this.orders.save(order);
  }

  get(orderId: string): PurchaseOrder {
    const order = this.orders.getById(orderId);
    if (!order) throw new PurchaseOrderNotFoundError(orderId);
    return order;
  }

  listByJourney(journeyId: string): readonly PurchaseOrder[] {
    return this.orders.listByJourney(journeyId);
  }

  confirm(orderId: string): PurchaseOrder {
    const current = this.get(orderId);
    if (current.status === "CONFIRMED") return current;
    if (current.status !== "DRAFT") throw new PurchaseOrderStateError("Solo se puede confirmar un pedido en borrador.");
    const now = new Date().toISOString();
    return this.orders.save(Object.freeze({ ...current, status: "CONFIRMED", updatedAt: now, confirmedAt: now }));
  }

  cancel(orderId: string): PurchaseOrder {
    const current = this.get(orderId);
    if (current.status === "CANCELLED") return current;
    if (current.status === "CONFIRMED" || current.status === "PAID") throw new PurchaseOrderStateError("Un pedido confirmado o pagado requiere un flujo de devolución.");
    const now = new Date().toISOString();
    return this.orders.save(Object.freeze({ ...current, status: "CANCELLED", updatedAt: now, cancelledAt: now }));
  }
}
