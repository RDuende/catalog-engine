import type { PurchaseOrder } from "../purchase-experience/index.js";

export type SalesChannelId =
  | "WOOCOMMERCE"
  | "AMAZON"
  | "PRINTSTUDIO"
  | "DIRECT";

export type ChannelPublicationStatus =
  | "PENDING"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELLED";

export interface PurchaseContractCustomer {
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
}

export interface PurchaseContractAddress {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly company?: string;
  readonly address1: string;
  readonly address2?: string;
  readonly city: string;
  readonly state?: string;
  readonly postcode: string;
  readonly country: string;
  readonly phone?: string;
  readonly email?: string;
}

export interface PurchaseContract {
  readonly version: "1.0";
  readonly order: PurchaseOrder;
  readonly customer?: PurchaseContractCustomer;
  readonly billing?: PurchaseContractAddress;
  readonly shipping?: PurchaseContractAddress;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface PublishPurchaseOrderInput {
  readonly channel: SalesChannelId;
  readonly idempotencyKey?: string;
  readonly customer?: PurchaseContractCustomer;
  readonly billing?: PurchaseContractAddress;
  readonly shipping?: PurchaseContractAddress;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface ChannelPublishResult {
  readonly externalOrderId: string;
  readonly externalOrderNumber?: string;
  readonly externalStatus?: string;
  readonly externalUrl?: string;
  readonly raw?: unknown;
}

export interface ChannelAdapter {
  readonly id: SalesChannelId;
  publish(
    contract: PurchaseContract,
    idempotencyKey: string,
  ): Promise<ChannelPublishResult>;
}

export interface ChannelPublication {
  readonly id: string;
  readonly orderId: string;
  readonly journeyId: string;
  readonly channel: SalesChannelId;
  readonly status: ChannelPublicationStatus;
  readonly idempotencyKey: string;
  readonly contractVersion: "1.0";
  readonly externalOrderId?: string;
  readonly externalOrderNumber?: string;
  readonly externalStatus?: string;
  readonly externalUrl?: string;
  readonly error?: string;
  readonly attempts: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt?: string;
}

export interface ChannelPublicationRepository {
  save(publication: ChannelPublication): ChannelPublication;
  getById(id: string): ChannelPublication | undefined;
  getByIdempotencyKey(
    idempotencyKey: string,
  ): ChannelPublication | undefined;
  listAll(): readonly ChannelPublication[];
  listByOrder(orderId: string): readonly ChannelPublication[];
}

export interface ChannelProductMapping {
  readonly internalProductId: string;
  readonly externalProductId: number;
  readonly externalVariationId?: number;
}

export interface ChannelProductMappingPort {
  resolve(
    channel: SalesChannelId,
    internalProductId: string,
  ): ChannelProductMapping | undefined;
}


export type WooCommerceWebhookTopic =
  | "order.created"
  | "order.updated"
  | "order.deleted"
  | "order.restored";

export interface WooCommerceWebhookOrder {
  readonly id: number;
  readonly number?: string;
  readonly status?: string;
}

export interface ChannelPublicationQueueItem {
  readonly id: string;
  readonly publicationId: string;
  readonly orderId: string;
  readonly channel: SalesChannelId;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  readonly nextAttemptAt: string;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChannelPublicationQueueRepository {
  save(item: ChannelPublicationQueueItem): ChannelPublicationQueueItem;
  getById(id: string): ChannelPublicationQueueItem | undefined;
  listDue(now: string): readonly ChannelPublicationQueueItem[];
}
