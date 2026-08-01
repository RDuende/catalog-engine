import type { FastifyInstance } from "fastify";
import { CommercialMemoryService } from "../commercial-memory/commercial-memory.service.js";
import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import { RaiCommercialChatBodySchema, RaiCommercialSelectBodySchema, type RaiCommercialChatBody, type RaiCommercialSelectBody } from "./rai-commercial.schemas.js";
import { RaiCommercialService } from "./rai-commercial.service.js";

export async function raiCommercialRoutes(app: FastifyInstance): Promise<void> {
  const service = new RaiCommercialService(new RecommendationService({ memory: new CommercialMemoryService() }));
  app.post<{ Body: RaiCommercialChatBody }>("/rai-commercial/chat", { schema: { body: RaiCommercialChatBodySchema } }, async (request) => service.chat(request.body));
  app.post<{ Body: RaiCommercialSelectBody }>("/rai-commercial/select", { schema: { body: RaiCommercialSelectBodySchema } }, async (request) => service.selectProduct(request.body.sessionId, request.body.productId));
  app.get<{ Params: { sessionId: string } }>("/rai-commercial/sessions/:sessionId", async (request, reply) => {
    const state = service.getSession(request.params.sessionId);
    return state ? { sessionId: request.params.sessionId, state } : reply.code(404).send({ error: "SESSION_NOT_FOUND", message: "Sesión no encontrada." });
  });
  app.delete<{ Params: { sessionId: string } }>("/rai-commercial/sessions/:sessionId", async (request) => ({ deleted: service.clearSession(request.params.sessionId) }));
}
