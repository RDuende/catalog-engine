import type { FastifyInstance } from "fastify";
import type { AiIntelligenceService } from "./ai-intelligence.service.js";
import type { AiLabScenario } from "./ai-intelligence.types.js";

export async function aiIntelligenceRoutes(app: FastifyInstance, service: AiIntelligenceService) {
  app.post("/ai-lab/run", async (request, reply) => {
    const input = (request.body ?? {}) as AiLabScenario;
    if (!input.message?.trim()) return reply.code(400).send({ error: "VALIDATION_ERROR", message: "Escribe un escenario para analizar." });
    return service.run(input);
  });
  app.get("/intelligence-center/traces", async (request) => {
    const query = request.query as { limit?: string };
    return { items: await service.list(query.limit ? Number(query.limit) : 50) };
  });
  app.get("/intelligence-center/traces/:traceId", async (request, reply) => {
    const { traceId } = request.params as { traceId: string };
    return await service.get(traceId) ?? reply.code(404).send({ error: "NOT_FOUND", message: "Traza no encontrada." });
  });
}
