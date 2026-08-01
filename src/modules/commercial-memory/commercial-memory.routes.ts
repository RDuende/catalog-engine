import type { FastifyInstance } from "fastify";
import { FeedbackBodySchema, type FeedbackBody } from "./commercial-memory.schemas.js";
import { CommercialMemoryService } from "./commercial-memory.service.js";

export async function commercialMemoryRoutes(app: FastifyInstance): Promise<void> {
  const service = new CommercialMemoryService();
  app.post<{ Body: FeedbackBody }>("/commercial-memory/feedback", { schema: { body: FeedbackBodySchema } }, async (request, reply) => {
    await service.recordFeedback(request.body);
    return reply.code(201).send({ ok: true });
  });
  app.get("/commercial-memory/stats", async () => service.stats());
  app.get<{ Querystring: { limit?: string } }>("/commercial-memory/history", async (request) => service.history(Number(request.query.limit ?? 20)));
}
