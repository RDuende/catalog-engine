import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import type {
  ChannelAdapterService,
} from "./channel-adapter.service.js";
import type {
  WooCommerceWebhookOrder,
  WooCommerceWebhookTopic,
} from "./channel-adapter.types.js";

function safeEquals(
  left: string,
  right: string,
): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}

export class WooCommerceWebhookService {
  constructor(
    private readonly secret: string,
    private readonly channels: ChannelAdapterService,
  ) {}

  verify(
    rawBody: string,
    signature: string | undefined,
  ): void {
    if (!signature) {
      throw new Error(
        "Falta la firma del webhook de WooCommerce.",
      );
    }

    const expected = createHmac(
      "sha256",
      this.secret,
    )
      .update(rawBody)
      .digest("base64");

    if (!safeEquals(expected, signature)) {
      throw new Error(
        "Firma de webhook WooCommerce no válida.",
      );
    }
  }

  process(
    topic: WooCommerceWebhookTopic,
    order: WooCommerceWebhookOrder,
  ) {
    if (
      topic !== "order.created" &&
      topic !== "order.updated" &&
      topic !== "order.deleted" &&
      topic !== "order.restored"
    ) {
      throw new Error(
        `Topic WooCommerce no soportado: ${topic}.`,
      );
    }

    return this.channels.syncExternalStatus({
      channel: "WOOCOMMERCE",
      externalOrderId: String(order.id),
      ...(order.number
        ? { externalOrderNumber: order.number }
        : {}),
      ...(order.status
        ? { externalStatus: order.status }
        : {}),
    });
  }
}
