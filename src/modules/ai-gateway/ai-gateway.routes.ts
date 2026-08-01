import type { FastifyPluginAsync } from "fastify";
import { AIGatewayService } from "./ai-gateway.service.js";
import { conversationExtractBodySchema } from "./ai-gateway.schemas.js";
import type { ConversationExtractRequest } from "./ai-gateway.types.js";

export const aiGatewayRoutes: FastifyPluginAsync = async (app) => {
  const service = new AIGatewayService();

  app.get("/ai/status", async () => service.status());

  app.post<{ Body: ConversationExtractRequest }>("/ai/conversation/extract", {
    schema: { body: conversationExtractBodySchema },
  }, async (request) => service.understandConversation(request.body));
};
