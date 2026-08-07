import type { FastifyInstance } from "fastify";
import { MvpOrchestrator } from "./mvp-orchestrator.js";
import type { MvpJourneyRequest } from "./mvp-orchestrator.types.js";

const bodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["message"],
  properties: {
    message: { type: "string", minLength: 1, maxLength: 5000 },
    journeyId: { type: "string", minLength: 1 },
    sessionId: { type: "string", minLength: 1 },
    correlationId: { type: "string", minLength: 1 },
    facts: { type: "array", items: { type: "object" } },
    now: { type: "string" },
  },
} as const;

export async function mvpOrchestratorRoutes(app: FastifyInstance) {
  const orchestrator = new MvpOrchestrator();
  app.post<{ Body: MvpJourneyRequest }>(
    "/mvp/journeys",
    { schema: { body: bodySchema } },
    async (request, reply) => {
      const result = await orchestrator.run(request.body);
      return reply.code(result.status === "COMPLETED" ? 201 : 200).send(result);
    },
  );
}
