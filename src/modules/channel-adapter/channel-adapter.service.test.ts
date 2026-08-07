import assert from "node:assert/strict";
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
import type {
  ChannelAdapter,
} from "./channel-adapter.types.js";

function fixture() {
  const catalog = new InMemorySmartCatalogRepository([
    Object.freeze({
      id: "mug",
      sku: "MUG-1",
      name: "Taza",
      category: "DRINKWARE",
      price: 15,
      cost: 5,
      currency: "EUR",
      stock: 10,
      productionDays: 2,
      tags: Object.freeze(["personalizable"]),
      emotionalGoals: Object.freeze(["CELEBRATION"]),
      visualStyles: Object.freeze(["MINIMAL"]),
      presentationTemplateIds: Object.freeze(["mug-wrap-v1"]),
      active: true,
    }),
  ]);

  const purchases = new PurchaseExperienceService(
    new InMemoryPurchaseOrderRepository(),
    catalog,
  );

  const service = new ChannelAdapterService(
    purchases,
    new InMemoryChannelPublicationRepository(),
  );

  return { purchases, service };
}

test("publica un pedido confirmado en un canal", async () => {
  const { purchases, service } = fixture();

  const adapter: ChannelAdapter = {
    id: "WOOCOMMERCE",
    async publish() {
      return {
        externalOrderId: "501",
        externalOrderNumber: "501",
        externalStatus: "pending",
      };
    },
  };

  service.register(adapter);

  const order = purchases.create({
    journeyId: "journey-1",
    lines: [{ productId: "mug", quantity: 1 }],
  });
  purchases.confirm(order.id);

  const publication = await service.publish(order.id, {
    channel: "WOOCOMMERCE",
  });

  assert.equal(publication.status, "PUBLISHED");
  assert.equal(publication.externalOrderId, "501");
});

test("repetir la publicación es idempotente", async () => {
  const { purchases, service } = fixture();
  let calls = 0;

  service.register({
    id: "WOOCOMMERCE",
    async publish() {
      calls += 1;
      return { externalOrderId: "502" };
    },
  });

  const order = purchases.create({
    journeyId: "journey-2",
    lines: [{ productId: "mug", quantity: 1 }],
  });
  purchases.confirm(order.id);

  const first = await service.publish(order.id, {
    channel: "WOOCOMMERCE",
    idempotencyKey: "fixed-key",
  });
  const second = await service.publish(order.id, {
    channel: "WOOCOMMERCE",
    idempotencyKey: "fixed-key",
  });

  assert.equal(first.id, second.id);
  assert.equal(calls, 1);
});
