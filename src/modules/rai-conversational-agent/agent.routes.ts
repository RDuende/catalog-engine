import type { FastifyInstance } from "fastify";
import { RaiConversationalAgentService } from "./agent.service.js";
import type { ConversationalAgentRequest } from "./agent.types.js";

const requestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["message"],
  properties: {
    message: { type: "string", minLength: 1, maxLength: 8000 },
    context: { type: "object", additionalProperties: true },
    history: {
      type: "array",
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["role", "content"],
        properties: { role: { type: "string", enum: ["user", "assistant"] }, content: { type: "string", maxLength: 8000 } },
      },
    },
    limit: { type: "integer", minimum: 1, maximum: 12 },
  },
} as const;

export async function raiConversationalAgentRoutes(app: FastifyInstance) {
  const service = new RaiConversationalAgentService();
  app.get("/rai-agent/status", async () => service.status());
  app.post<{ Body: ConversationalAgentRequest }>("/rai-agent/chat", { schema: { body: requestSchema } }, async (request, reply) => {
    const result = await service.chat(request.body);
    return result.status === "FAILED" ? reply.code(502).send(result) : result;
  });
}
