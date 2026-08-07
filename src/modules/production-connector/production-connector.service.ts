import {
  createHash,
  randomUUID,
} from "node:crypto";

import type {
  PurchaseExperienceService,
  PurchaseOrder,
} from "../purchase-experience/index.js";
import type {
  DispatchProductionInput,
  ProductionAdapter,
  ProductionDispatch,
  ProductionDispatchRepository,
} from "./production-connector.types.js";
import {
  buildProductionPackage,
} from "./production-package.builder.js";

function stableKey(
  order: PurchaseOrder,
  provided: string | undefined,
): string {
  const normalized = provided?.trim();
  if (normalized) return normalized;

  return createHash("sha256")
    .update(
      JSON.stringify({
        orderId: order.id,
        updatedAt: order.updatedAt,
        lines: order.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          presentationArtifactId:
            line.presentationArtifactId,
        })),
      }),
    )
    .digest("hex");
}

export class ProductionConnectorService {
  constructor(
    private readonly purchases: PurchaseExperienceService,
    private readonly repository: ProductionDispatchRepository,
    private readonly adapter?: ProductionAdapter,
  ) {}

  configured(): boolean {
    return Boolean(this.adapter);
  }

  list(orderId: string): readonly ProductionDispatch[] {
    this.purchases.get(orderId);
    return this.repository.listByOrder(orderId);
  }

  async dispatch(
    orderId: string,
    input: DispatchProductionInput = {},
  ): Promise<ProductionDispatch> {
    const order = this.purchases.get(orderId);

    if (order.status !== "PAID") {
      throw new Error(
        "Solo se pueden enviar a producción pedidos pagados.",
      );
    }

    if (!this.adapter) {
      throw new Error(
        "RDuendeGest no está configurado.",
      );
    }

    const key = stableKey(
      order,
      input.idempotencyKey,
    );

    const previous =
      this.repository.getByIdempotencyKey(key);

    if (previous?.status === "DISPATCHED") {
      return previous;
    }

    const now = new Date().toISOString();

    const pending: ProductionDispatch = Object.freeze({
      id: previous?.id ?? randomUUID(),
      orderId: order.id,
      journeyId: order.journeyId,
      adapter: "RDUENDEGEST",
      status: "PENDING",
      idempotencyKey: key,
      attempts: (previous?.attempts ?? 0) + 1,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });

    this.repository.save(pending);

    try {
      const result = await this.adapter.dispatch(
        buildProductionPackage(
          order,
          input.metadata,
        ),
        key,
      );

      const dispatchedAt = new Date().toISOString();

      return this.repository.save(
        Object.freeze({
          ...pending,
          status: "DISPATCHED",
          externalJobId: result.externalJobId,
          ...(result.externalJobNumber
            ? {
                externalJobNumber:
                  result.externalJobNumber,
              }
            : {}),
          ...(result.externalStatus
            ? {
                externalStatus:
                  result.externalStatus,
              }
            : {}),
          ...(result.externalUrl
            ? {
                externalUrl: result.externalUrl,
              }
            : {}),
          updatedAt: dispatchedAt,
          dispatchedAt,
        }),
      );
    } catch (error) {
      const failedAt = new Date().toISOString();

      this.repository.save(
        Object.freeze({
          ...pending,
          status: "FAILED",
          error:
            error instanceof Error
              ? error.message
              : String(error),
          updatedAt: failedAt,
        }),
      );

      throw error;
    }
  }
}
