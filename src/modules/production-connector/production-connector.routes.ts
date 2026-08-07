import type {
  FastifyInstance,
  FastifyReply,
} from "fastify";

import type {
  DispatchProductionInput,
} from "./production-connector.types.js";
import type {
  ProductionConnectorService,
} from "./production-connector.service.js";

function sendError(
  reply: FastifyReply,
  error: unknown,
): unknown {
  const message =
    error instanceof Error
      ? error.message
      : "Error enviando el pedido a producción.";

  if (/no está configurado/iu.test(message)) {
    return reply.code(503).send({
      error: "RDUENDEGEST_NOT_CONFIGURED",
      message,
    });
  }

  if (/pedidos pagados/iu.test(message)) {
    return reply.code(409).send({
      error: "ORDER_NOT_PAID",
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
    error: "PRODUCTION_DISPATCH_FAILED",
    message,
  });
}

export async function productionConnectorRoutes(
  app: FastifyInstance,
  service: ProductionConnectorService,
): Promise<void> {
  app.get("/production/connectors", async () => ({
    connectors: [
      {
        id: "RDUENDEGEST",
        configured: service.configured(),
      },
    ],
  }));

  app.get<{
    Params: { orderId: string };
  }>(
    "/purchase/orders/:orderId/production-dispatches",
    async (request, reply) => {
      try {
        return {
          dispatches: service.list(
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
    Body: DispatchProductionInput;
  }>(
    "/purchase/orders/:orderId/production-dispatches",
    async (request, reply) => {
      try {
        const dispatch = await service.dispatch(
          request.params.orderId,
          request.body ?? {},
        );

        return reply.code(201).send({ dispatch });
      } catch (error) {
        return sendError(reply, error);
      }
    },
  );
}
