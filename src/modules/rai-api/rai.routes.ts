import type { FastifyInstance } from "fastify";
import { RaiConversationBodySchema, type RaiConversationBody } from "./rai.schemas.js";
import { RaiService } from "./rai.service.js";

export async function raiRoutes(app: FastifyInstance): Promise<void> {
  const service = new RaiService();
  app.post<{ Body: RaiConversationBody }>(
    "/rai/converse",
    { schema: { body: RaiConversationBodySchema } },
    async (request, reply) => reply.code(200).send(await service.converse(request.body)),
  );
}
