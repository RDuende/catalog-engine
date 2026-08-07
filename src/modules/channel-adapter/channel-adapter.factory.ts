import type {
  PurchaseExperienceService,
} from "../purchase-experience/index.js";
import { ChannelAdapterService } from "./channel-adapter.service.js";
import { StaticChannelProductMapping } from "./channel-product-mapping.js";
import { FileChannelPublicationRepository } from "./channel-publication.repository.js";
import {
  HttpWooCommerceClient,
  WooCommerceChannelAdapter,
} from "./woocommerce.adapter.js";
import { FileChannelPublicationQueueRepository } from "./channel-publication-queue.repository.js";
import { ChannelPublicationQueueService } from "./channel-publication-queue.service.js";
import { WooCommerceWebhookService } from "./woocommerce-webhook.service.js";

export interface DefaultChannelAdapterBundle {
  readonly channels: ChannelAdapterService;
  readonly queue: ChannelPublicationQueueService;
  readonly webhook?: WooCommerceWebhookService;
}

export function createDefaultChannelAdapterBundle(
  purchases: PurchaseExperienceService,
): DefaultChannelAdapterBundle {
  const service = new ChannelAdapterService(
    purchases,
    new FileChannelPublicationRepository(
      process.env.CHANNEL_PUBLICATIONS_FILE ??
        ".data/channel-publications.json",
    ),
  );

  const baseUrl = process.env.WOOCOMMERCE_BASE_URL?.trim();
  const consumerKey =
    process.env.WOOCOMMERCE_CONSUMER_KEY?.trim();
  const consumerSecret =
    process.env.WOOCOMMERCE_CONSUMER_SECRET?.trim();

  if (baseUrl && consumerKey && consumerSecret) {
    const mappings = StaticChannelProductMapping.fromJson(
      process.env.WOOCOMMERCE_PRODUCT_MAP,
    );

    service.register(
      new WooCommerceChannelAdapter(
        new HttpWooCommerceClient({
          baseUrl,
          consumerKey,
          consumerSecret,
        }),
        mappings,
      ),
    );
  }

  const queue = new ChannelPublicationQueueService(
    service,
    new FileChannelPublicationQueueRepository(
      process.env.CHANNEL_PUBLICATION_QUEUE_FILE ??
        ".data/channel-publication-queue.json",
    ),
  );

  const webhookSecret =
    process.env.WOOCOMMERCE_WEBHOOK_SECRET?.trim();

  return Object.freeze({
    channels: service,
    queue,
    ...(webhookSecret
      ? {
          webhook: new WooCommerceWebhookService(
            webhookSecret,
            service,
          ),
        }
      : {}),
  });
}

export function createDefaultChannelAdapterService(
  purchases: PurchaseExperienceService,
): ChannelAdapterService {
  return createDefaultChannelAdapterBundle(
    purchases,
  ).channels;
}
