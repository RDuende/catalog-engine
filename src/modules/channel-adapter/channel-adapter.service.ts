import { createHash, randomUUID } from "node:crypto";

import type {
  PurchaseExperienceService,
  PurchaseOrder,
} from "../purchase-experience/index.js";
import type {
  ChannelAdapter,
  ChannelPublication,
  ChannelPublicationRepository,
  PublishPurchaseOrderInput,
  PurchaseContract,
  SalesChannelId,
} from "./channel-adapter.types.js";

function idempotencyKey(
  order: PurchaseOrder,
  channel: SalesChannelId,
  provided: string | undefined,
): string {
  const normalized = provided?.trim();
  if (normalized) return normalized;

  return createHash("sha256")
    .update(
      JSON.stringify({
        orderId: order.id,
        channel,
        updatedAt: order.updatedAt,
      }),
    )
    .digest("hex");
}

export class ChannelAdapterService {
  readonly #adapters = new Map<SalesChannelId, ChannelAdapter>();

  constructor(
    private readonly purchases: PurchaseExperienceService,
    private readonly publications: ChannelPublicationRepository,
  ) {}

  register(adapter: ChannelAdapter): void {
    this.#adapters.set(adapter.id, adapter);
  }

  configuredChannels(): readonly SalesChannelId[] {
    return Object.freeze([...this.#adapters.keys()]);
  }

  list(orderId: string): readonly ChannelPublication[] {
    this.purchases.get(orderId);
    return this.publications.listByOrder(orderId);
  }

  getPublication(id: string): ChannelPublication {
    const publication = this.publications.getById(id);
    if (!publication) {
      throw new Error(`No existe la publicación ${id}.`);
    }
    return publication;
  }

  async retryPublication(
    publicationId: string,
  ): Promise<ChannelPublication> {
    const publication = this.getPublication(
      publicationId,
    );

    return this.publish(publication.orderId, {
      channel: publication.channel,
      idempotencyKey: publication.idempotencyKey,
    });
  }

  syncExternalStatus(input: {
    readonly channel: SalesChannelId;
    readonly externalOrderId: string;
    readonly externalOrderNumber?: string;
    readonly externalStatus?: string;
    readonly externalUrl?: string;
  }): ChannelPublication {
    const publication = [
      ...this.publications.listByOrder(""),
    ].find(() => false);

    const candidates = (
      this.publications as unknown as {
        listAll?: () => readonly ChannelPublication[];
      }
    ).listAll?.() ?? [];

    const found = candidates.find(
      (item) =>
        item.channel === input.channel &&
        item.externalOrderId ===
          input.externalOrderId,
    );

    if (!found) {
      throw new Error(
        `No existe una publicación para el pedido externo ${input.externalOrderId}.`,
      );
    }

    return this.publications.save(
      Object.freeze({
        ...found,
        ...(input.externalOrderNumber
          ? {
              externalOrderNumber:
                input.externalOrderNumber,
            }
          : {}),
        ...(input.externalStatus
          ? { externalStatus: input.externalStatus }
          : {}),
        ...(input.externalUrl
          ? { externalUrl: input.externalUrl }
          : {}),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  async publish(
    orderId: string,
    input: PublishPurchaseOrderInput,
  ): Promise<ChannelPublication> {
    const order = this.purchases.get(orderId);

    if (order.status !== "CONFIRMED" && order.status !== "PAID") {
      throw new Error(
        "Solo se pueden publicar pedidos confirmados o pagados.",
      );
    }

    const adapter = this.#adapters.get(input.channel);
    if (!adapter) {
      throw new Error(
        `El canal ${input.channel} no está configurado.`,
      );
    }

    const key = idempotencyKey(
      order,
      input.channel,
      input.idempotencyKey,
    );

    const previous =
      this.publications.getByIdempotencyKey(key);

    if (previous?.status === "PUBLISHED") {
      return previous;
    }

    const now = new Date().toISOString();
    const publication: ChannelPublication = Object.freeze({
      id: previous?.id ?? randomUUID(),
      orderId: order.id,
      journeyId: order.journeyId,
      channel: input.channel,
      status: "PENDING",
      idempotencyKey: key,
      contractVersion: "1.0",
      attempts: (previous?.attempts ?? 0) + 1,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });

    this.publications.save(publication);

    const contract: PurchaseContract = Object.freeze({
      version: "1.0",
      order,
      ...(input.customer ? { customer: input.customer } : {}),
      ...(input.billing ? { billing: input.billing } : {}),
      ...(input.shipping ? { shipping: input.shipping } : {}),
      metadata: Object.freeze({
        source: "RECUERDARTE",
        ...(input.metadata ?? {}),
      }),
    });

    try {
      const result = await adapter.publish(contract, key);
      const publishedAt = new Date().toISOString();

      return this.publications.save(
        Object.freeze({
          ...publication,
          status: "PUBLISHED",
          externalOrderId: result.externalOrderId,
          ...(result.externalOrderNumber
            ? {
                externalOrderNumber:
                  result.externalOrderNumber,
              }
            : {}),
          ...(result.externalStatus
            ? { externalStatus: result.externalStatus }
            : {}),
          ...(result.externalUrl
            ? { externalUrl: result.externalUrl }
            : {}),
          updatedAt: publishedAt,
          publishedAt,
        }),
      );
    } catch (error) {
      const failedAt = new Date().toISOString();

      this.publications.save(
        Object.freeze({
          ...publication,
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
