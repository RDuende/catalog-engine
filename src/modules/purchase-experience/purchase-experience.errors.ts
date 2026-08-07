export class PurchaseOrderValidationError extends Error {
  readonly code = "PURCHASE_ORDER_VALIDATION_ERROR";
  constructor(message: string) { super(message); this.name = "PurchaseOrderValidationError"; }
}
export class PurchaseOrderNotFoundError extends Error {
  readonly code = "PURCHASE_ORDER_NOT_FOUND";
  constructor(orderId: string) { super(`No existe el pedido ${orderId}.`); this.name = "PurchaseOrderNotFoundError"; }
}
export class PurchaseOrderStateError extends Error {
  readonly code = "PURCHASE_ORDER_STATE_ERROR";
  constructor(message: string) { super(message); this.name = "PurchaseOrderStateError"; }
}
export class PaymentIntentNotFoundError extends Error {
  readonly code = "PAYMENT_INTENT_NOT_FOUND";
  constructor(intentId: string) { super(`No existe el intento de pago ${intentId}.`); this.name = "PaymentIntentNotFoundError"; }
}
export class PaymentIntentStateError extends Error {
  readonly code = "PAYMENT_INTENT_STATE_ERROR";
  constructor(message: string) { super(message); this.name = "PaymentIntentStateError"; }
}
