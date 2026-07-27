import type { FastifyInstance } from "fastify";
import { RaiConversationBodySchema, type RaiConversationBody } from "./rai.schemas.js";
import { RaiService, raiAgent } from "./rai.service.js";
import { generateProductMockup } from "../visual-commerce/index.js";
import { Type, type Static } from "@sinclair/typebox";

const SelectBodySchema = Type.Object({ sessionId: Type.String(), productId: Type.String(), modelImageUrl: Type.Optional(Type.String({ maxLength: 12000000 })) }, { additionalProperties: false });
const MockupBodySchema = Type.Object({
  sessionId: Type.String(),
  imageDataUrl: Type.String({ maxLength: 12500000 }),
  text: Type.Optional(Type.String({ maxLength: 160 })),
}, { additionalProperties: false });
type SelectBody = Static<typeof SelectBodySchema>;
type MockupBody = Static<typeof MockupBodySchema>;

export async function raiRoutes(app: FastifyInstance): Promise<void> {
  const service = new RaiService();
  app.post<{ Body: RaiConversationBody }>(
    "/rai/converse",
    { schema: { body: RaiConversationBodySchema } },
    async (request, reply) => {
      try {
        return reply.code(200).send(await service.converse(request.body));
      } catch (error) {
        const err = error as Error & { raiDebug?: unknown; statusCode?: number };
        request.log.error({ err, raiDebug: err.raiDebug }, "Rai Agent request failed");
        return reply.code(err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500).send({
          status: "agent_error",
          message: err.message || "No se pudo completar la respuesta.",
          debug: err.raiDebug ?? null,
        });
      }
    },
  );

  app.post<{ Body: SelectBody }>("/rai/select-product", { schema: { body: SelectBodySchema } }, async (request, reply) => {
    try {
      const state = raiAgent.selectProduct(request.body.sessionId, request.body.productId, request.body.modelImageUrl);
      return reply.send({ status: "product_selected", sessionId: request.body.sessionId, state, selectedProduct: state.selectedProduct });
    } catch (error) { return reply.code(400).send({ status: "selection_error", message: error instanceof Error ? error.message : String(error) }); }
  });

  app.post<{ Body: MockupBody }>(
    "/rai/mockup",
    {
      // Fastify limita por defecto el JSON a 1 MiB. Una foto de 8 MiB en base64
      // ocupa aproximadamente 11 MiB, por lo que la petición se rechazaba antes
      // de llegar al generador de mockups.
      bodyLimit: 13 * 1024 * 1024,
      schema: { body: MockupBodySchema },
    },
    async (request, reply) => {
    try {
      const state = raiAgent.getSessionState(request.body.sessionId);
      if (!state?.selectedProduct) return reply.code(400).send({ status: "mockup_error", message: "Primero selecciona un modelo." });
      const mockup = await generateProductMockup({
        productName: state.selectedProduct.name,
        productImageUrl: state.selectedProduct.imageUrl,
        customerImageDataUrl: request.body.imageDataUrl,
        text: request.body.text ?? state.personalization.text,
        style: state.personalization.style,
        size: state.personalization.size,
      });
      return reply.send({ status: "mockup_ready", sessionId: request.body.sessionId, product: state.selectedProduct, mockup });
    } catch (error) {
      request.log.error({ err: error }, "Mockup generation failed");
      return reply.code(400).send({
        status: "mockup_error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
