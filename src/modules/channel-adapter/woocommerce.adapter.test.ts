import assert from "node:assert/strict";
import test from "node:test";

import { StaticChannelProductMapping } from "./channel-product-mapping.js";
import {
  WooCommerceChannelAdapter,
  type WooCommerceOrderPayload,
} from "./woocommerce.adapter.js";

test("traduce PurchaseContract a pedido WooCommerce", async () => {
  let payload: WooCommerceOrderPayload | undefined;

  const adapter = new WooCommerceChannelAdapter(
    {
      async createOrder(input) {
        payload = input;
        return {
          id: 700,
          number: "700",
          status: "pending",
        };
      },
    },
    new StaticChannelProductMapping([
      {
        internalProductId: "mug",
        externalProductId: 101,
      },
    ]),
  );

  const result = await adapter.publish(
    {
      version: "1.0",
      order: {
        id: "order-1",
        journeyId: "journey-1",
        status: "CONFIRMED",
        lines: [
          {
            productId: "mug",
            sku: "MUG-1",
            name: "Taza",
            quantity: 1,
            unitPrice: 15,
            lineTotal: 15,
            currency: "EUR",
            presentationArtifactId: "preview-1",
          },
        ],
        totals: {
          subtotal: 15,
          shipping: 4.95,
          tax: 0,
          total: 19.95,
          currency: "EUR",
        },
        createdAt: "2026-08-04T20:00:00.000Z",
        updatedAt: "2026-08-04T20:01:00.000Z",
        confirmedAt: "2026-08-04T20:01:00.000Z",
      },
      metadata: {
        source: "RECUERDARTE",
      },
    },
    "woo-idempotency",
  );

  assert.equal(result.externalOrderId, "700");
  assert.equal(payload?.line_items[0]?.product_id, 101);
  assert.equal(
    payload?.line_items[0]?.meta_data.some(
      (item) =>
        item.key ===
        "_recuerdarte_presentation_artifact_id",
    ),
    true,
  );
});
