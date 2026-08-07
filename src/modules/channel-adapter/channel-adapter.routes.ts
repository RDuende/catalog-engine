import type {
  FastifyInstance,
  FastifyReply,
} from "fastify";

import type { ChannelAdapterService } from "./channel-adapter.service.js";
import type {
  PublishPurchaseOrderInput,
  WooCommerceWebhookOrder,
  WooCommerceWebhookTopic,
} from "./channel-adapter.types.js";
import type { ChannelPublicationQueueService } from "./channel-publication-queue.service.js";
import type { WooCommerceWebhookService } from "./woocommerce-webhook.service.js";

function sendError(
  reply: FastifyReply,
  error: unknown,
): unknown {
  const message =
    error instanceof Error
      ? error.message
      : "Error de publicación en canal.";

  if (/no está configurado/iu.test(message)) {
    return reply.code(503).send({
      error: "CHANNEL_NOT_CONFIGURED",
      message,
    });
  }

  if (/confirmados o pagados/iu.test(message)) {
    return reply.code(409).send({
      error: "ORDER_NOT_READY_FOR_CHANNEL",
      message,
    });
  }

  if (/No existe|no encontrado/iu.test(message)) {
    return reply.code(404).send({
      error: "ORDER_NOT_FOUND",
      message,
    });
  }

  return reply.code(400).send({
    error: "CHANNEL_PUBLICATION_FAILED",
    message,
  });
}

export async function channelAdapterRoutes(
  app: FastifyInstance,
  service: ChannelAdapterService,
  queue?: ChannelPublicationQueueService,
  webhook?: WooCommerceWebhookService,
): Promise<void> {
  app.get("/channels", async () => ({
    channels: service.configuredChannels(),
  }));

  app.get<{
    Params: { orderId: string };
  }>(
    "/purchase/orders/:orderId/channel-publications",
    async (request, reply) => {
      try {
        return {
          publications: service.list(
            request.params.orderId,
          ),
        };
      } catch (error) {
        return sendError(reply, error);
      }
    },
  );

  app.post<{
    Params: { orderId: string };
    Body: PublishPurchaseOrderInput;
  }>(
    "/purchase/orders/:orderId/channel-publications",
    async (request, reply) => {
      try {
        const publication = await service.publish(
          request.params.orderId,
          request.body,
        );

        return reply.code(201).send({ publication });
      } catch (error) {
        return sendError(reply, error);
      }
    },
  );

  app.post(
    "/channels/publication-queue/run",
    async (_request, reply) => {
      if (!queue) {
        return reply.code(503).send({
          error: "CHANNEL_QUEUE_NOT_CONFIGURED",
        });
      }

      return reply.send({
        processed: await queue.runDue(),
      });
    },
  );

  app.post<{
    Headers: {
      "x-wc-webhook-signature"?: string;
      "x-wc-webhook-topic"?: string;
    };
    Body: WooCommerceWebhookOrder;
  }>(
    "/channels/woocommerce/webhook",
    async (request, reply) => {
      if (!webhook) {
        return reply.code(503).send({
          error: "WOOCOMMERCE_WEBHOOK_NOT_CONFIGURED",
        });
      }

      try {
        const rawBody = JSON.stringify(request.body);
        webhook.verify(
          rawBody,
          request.headers[
            "x-wc-webhook-signature"
          ],
        );

        const publication = webhook.process(
          request.headers[
            "x-wc-webhook-topic"
          ] as WooCommerceWebhookTopic,
          request.body,
        );

        return reply.send({ publication });
      } catch (error) {
        return reply.code(401).send({
          error: "WOOCOMMERCE_WEBHOOK_REJECTED",
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );

}
