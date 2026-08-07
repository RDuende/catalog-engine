import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  InMemoryPurchaseOrderRepository,
  PurchaseExperienceService,
} from "../purchase-experience/index.js";
import {
  InMemorySmartCatalogRepository,
} from "../smart-catalog/index.js";
import { ChannelAdapterService } from "./channel-adapter.service.js";
import { InMemoryChannelPublicationRepository } from "./channel-publication.repository.js";
import { WooCommerceWebhookService } from "./woocommerce-webhook.service.js";

test("valida firma y sincroniza estado externo", async () => {
  const catalog = new InMemorySmartCatalogRepository([
    {
      id: "mug",
      sku: "MUG-1",
      name: "Taza",
      category: "DRINKWARE",
      price: 15,
      cost: 5,
      currency: "EUR",
      stock: 10,
      productionDays: 2,
      tags: [],
      emotionalGoals: [],
      visualStyles: [],
      presentationTemplateIds: [],
      active: true,
    },
  ]);

  const purchases = new PurchaseExperienceService(
    new InMemoryPurchaseOrderRepository(),
    catalog,
  );
  const publications =
    new InMemoryChannelPublicationRepository();
  const channels = new ChannelAdapterService(
    purchases,
    publications,
  );

  channels.register({
    id: "WOOCOMMERCE",
    async publish() {
      return {
        externalOrderId: "900",
        externalStatus: "pending",
      };
    },
  });

  const order = purchases.create({
    journeyId: "journey-live",
    lines: [{ productId: "mug", quantity: 1 }],
  });
  purchases.confirm(order.id);
  await channels.publish(order.id, {
    channel: "WOOCOMMERCE",
  });

  const webhook = new WooCommerceWebhookService(
    "secret",
    channels,
  );

  const raw = JSON.stringify({
    id: 900,
    status: "processing",
  });
  const signature = createHmac(
    "sha256",
    "secret",
  )
    .update(raw)
    .digest("base64");

  webhook.verify(raw, signature);
  const updated = webhook.process(
    "order.updated",
    {
      id: 900,
      status: "processing",
    },
  );

  assert.equal(
    updated.externalStatus,
    "processing",
  );
});
