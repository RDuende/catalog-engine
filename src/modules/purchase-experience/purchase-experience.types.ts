export type PurchaseOrderStatus = "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED";

export interface PurchaseOrderLine {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
  readonly currency: string;
  readonly presentationArtifactId?: string;
  readonly purchaseIntentArtifactId?: string;
  readonly workspaceArtifactIds?: readonly string[];
  readonly proposalId?: string;
}

export interface PurchaseOrderTotals {
  readonly subtotal: number;
  readonly shipping: number;
  readonly tax: number;
  readonly total: number;
  readonly currency: string;
}

export interface PurchaseOrder {
  readonly id: string;
  readonly journeyId: string;
  readonly status: PurchaseOrderStatus;
  readonly lines: readonly PurchaseOrderLine[];
  readonly totals: PurchaseOrderTotals;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly confirmedAt?: string;
  readonly paidAt?: string;
  readonly cancelledAt?: string;
  readonly paymentIntentId?: string;
}

export interface PurchaseOrderRepository {
  save(order: PurchaseOrder): PurchaseOrder;
  getById(id: string): PurchaseOrder | undefined;
  listByJourney(journeyId: string): readonly PurchaseOrder[];
}

export interface CreatePurchaseOrderInput {
  readonly journeyId: string;
  readonly lines: readonly {
    readonly productId: string;
    readonly quantity: number;
    readonly presentationArtifactId?: string;
    readonly purchaseIntentArtifactId?: string;
    readonly workspaceArtifactIds?: readonly string[];
    readonly proposalId?: string;
  }[];
}

export type PaymentIntentStatus =
  | "CREATED"
  | "REQUIRES_ACTION"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface PaymentIntent {
  readonly id: string;
  readonly orderId: string;
  readonly provider: string;
  readonly providerIntentId: string;
  readonly status: PaymentIntentStatus;
  readonly amount: number;
  readonly currency: string;
  readonly idempotencyKey: string;
  readonly clientSecret?: string;
  readonly failureCode?: string;
  readonly failureMessage?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly cancelledAt?: string;
  readonly expiresAt?: string;
}

export interface PaymentIntentRepository {
  save(intent: PaymentIntent): PaymentIntent;
  getById(id: string): PaymentIntent | undefined;
  getByIdempotencyKey(idempotencyKey: string): PaymentIntent | undefined;
  listByOrder(orderId: string): readonly PaymentIntent[];
}

export interface CreateProviderPaymentIntentInput {
  readonly orderId: string;
  readonly amount: number;
  readonly currency: string;
  readonly idempotencyKey: string;
  readonly description: string;
}

export interface ProviderPaymentIntent {
  readonly providerIntentId: string;
  readonly status: PaymentIntentStatus;
  readonly clientSecret?: string;
  readonly expiresAt?: string;
}

export interface PaymentProvider {
  readonly id: string;
  createIntent(input: CreateProviderPaymentIntentInput): ProviderPaymentIntent;
  confirmIntent(providerIntentId: string): ProviderPaymentIntent;
  cancelIntent(providerIntentId: string): ProviderPaymentIntent;
}
