import type {
  FastifyInstance,
} from "fastify";

import {
  defaultBrainOrchestratorIntelligence,
} from "./brain-orchestrator-intelligence.service.js";
import type {
  BrainIntelligenceInput,
} from "./brain-orchestrator-intelligence.types.js";

export async function
brainOrchestratorIntelligenceRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body:
      BrainIntelligenceInput;
  }>(
    "/api/v1/brain-orchestrator/intelligence/run",
    async (request) =>
      defaultBrainOrchestratorIntelligence
        .run(
          request.body,
        ),
  );

  app.get(
    "/api/v1/brain-orchestrator/intelligence/preset",
    async () => ({
      input: {
        conversationMessage:
          "No sé qué regalarle a mi padre",
        recipientLabel:
          "mi padre",
        occasion:
          "cumpleaños",
        budget: 70,
        interests: [
          "motocross",
        ],
        desiredImpact: [
          "sorprender",
        ],
        candidates: [],
      },
    }),
  );
}
