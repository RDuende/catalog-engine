import { randomUUID } from "node:crypto";
import { PaymentIntentNotFoundError, PaymentIntentStateError, PurchaseOrderNotFoundError, PurchaseOrderStateError } from "./purchase-experience.errors.js";
import type { PaymentIntent, PaymentIntentRepository, PaymentProvider, PurchaseOrderRepository } from "./purchase-experience.types.js";

export class PaymentIntentService {
  constructor(
    private readonly orders: PurchaseOrderRepository,
    private readonly intents: PaymentIntentRepository,
    private readonly provider: PaymentProvider,
  ) {}

  create(orderId: string, idempotencyKey?: string): PaymentIntent {
    const order = this.orders.getById(orderId);
    if (!order) throw new PurchaseOrderNotFoundError(orderId);
    if (order.status === "PAID") throw new PurchaseOrderStateError("El pedido ya está pagado.");
    if (order.status !== "CONFIRMED") throw new PurchaseOrderStateError("El pedido debe estar confirmado antes de iniciar el pago.");

    const key = (idempotencyKey?.trim() || `order:${order.id}:v1`);
    const existing = this.intents.getByIdempotencyKey(key);
    if (existing) return existing;

    const providerIntent = this.provider.createIntent({
      orderId: order.id,
      amount: order.totals.total,
      currency: order.totals.currency,
      idempotencyKey: key,
      description: `Pedido RecuerdArte ${order.id}`,
    });
    const now = new Date().toISOString();
    const base: PaymentIntent = {
      id: randomUUID(), orderId: order.id, provider: this.provider.id,
      providerIntentId: providerIntent.providerIntentId, status: providerIntent.status,
      amount: order.totals.total, currency: order.totals.currency,
      idempotencyKey: key, createdAt: now, updatedAt: now,
    };
    const intent: PaymentIntent = Object.freeze({
      ...base,
      ...(providerIntent.clientSecret ? { clientSecret: providerIntent.clientSecret } : {}),
      ...(providerIntent.expiresAt ? { expiresAt: providerIntent.expiresAt } : {}),
    });
    const saved = this.intents.save(intent);
    this.orders.save(Object.freeze({ ...order, paymentIntentId: saved.id, updatedAt: now }));
    return saved;
  }

  get(intentId: string): PaymentIntent {
    const intent=this.intents.getById(intentId); if(!intent) throw new PaymentIntentNotFoundError(intentId); return intent;
  }
  listByOrder(orderId: string): readonly PaymentIntent[] { return this.intents.listByOrder(orderId); }

  confirm(intentId: string): PaymentIntent {
    const current=this.get(intentId);
    if(current.status==="SUCCEEDED") return current;
    if(["CANCELLED","FAILED","EXPIRED"].includes(current.status)) throw new PaymentIntentStateError(`No se puede confirmar un intento ${current.status}.`);
    const providerResult=this.provider.confirmIntent(current.providerIntentId);
    const now=new Date().toISOString();
    const updated=this.intents.save(Object.freeze({ ...current, status:providerResult.status, updatedAt:now, ...(providerResult.status==="SUCCEEDED" ? {completedAt:now}: {}) }));
    if(updated.status==="SUCCEEDED") {
      const order=this.orders.getById(updated.orderId);
      if(order && order.status!=="PAID") this.orders.save(Object.freeze({ ...order, status:"PAID", paymentIntentId:updated.id, paidAt:now, updatedAt:now }));
    }
    return updated;
  }

  cancel(intentId: string): PaymentIntent {
    const current=this.get(intentId);
    if(current.status==="CANCELLED") return current;
    if(current.status==="SUCCEEDED") throw new PaymentIntentStateError("Un pago completado requiere un flujo de devolución.");
    const providerResult=this.provider.cancelIntent(current.providerIntentId);
    const now=new Date().toISOString();
    return this.intents.save(Object.freeze({ ...current, status:providerResult.status, updatedAt:now, cancelledAt:now }));
  }
}
