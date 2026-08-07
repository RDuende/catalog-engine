import type { PurchaseOrder } from "../purchase-experience/index.js";

export type ProductionDispatchStatus =
  | "PENDING"
  | "DISPATCHED"
  | "FAILED"
  | "CANCELLED";

export interface ProductionArtifactReference {
  readonly artifactId: string;
  readonly role:
    | "PURCHASE_INTENT"
    | "PERSONALIZATION"
    | "DESIGN"
    | "RENDER_SCENE"
    | "PREVIEW"
    | "PRESENTATION"
    | "OTHER";
}

export interface ProductionLineContract {
  readonly productId: string;
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly proposalId?: string;
  readonly artifacts: readonly ProductionArtifactReference[];
}

export interface ProductionPackage {
  readonly version: "1.0";
  readonly internalOrderId: string;
  readonly journeyId: string;
  readonly source: "RECUERDARTE";
  readonly status: PurchaseOrder["status"];
  readonly lines: readonly ProductionLineContract[];
  readonly totals: PurchaseOrder["totals"];
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
}

export interface ProductionDispatchResult {
  readonly externalJobId: string;
  readonly externalJobNumber?: string;
  readonly externalStatus?: string;
  readonly externalUrl?: string;
  readonly raw?: unknown;
}

export interface ProductionAdapter {
  readonly id: "RDUENDEGEST";
  dispatch(
    productionPackage: ProductionPackage,
    idempotencyKey: string,
  ): Promise<ProductionDispatchResult>;
}

export interface ProductionDispatch {
  readonly id: string;
  readonly orderId: string;
  readonly journeyId: string;
  readonly adapter: "RDUENDEGEST";
  readonly status: ProductionDispatchStatus;
  readonly idempotencyKey: string;
  readonly attempts: number;
  readonly externalJobId?: string;
  readonly externalJobNumber?: string;
  readonly externalStatus?: string;
  readonly externalUrl?: string;
  readonly error?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dispatchedAt?: string;
}

export interface ProductionDispatchRepository {
  save(dispatch: ProductionDispatch): ProductionDispatch;
  getById(id: string): ProductionDispatch | undefined;
  getByIdempotencyKey(
    idempotencyKey: string,
  ): ProductionDispatch | undefined;
  listByOrder(orderId: string): readonly ProductionDispatch[];
  listAll(): readonly ProductionDispatch[];
}

export interface DispatchProductionInput {
  readonly idempotencyKey?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}
