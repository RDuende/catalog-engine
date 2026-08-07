import type {
  FastifyInstance,
} from "fastify";

import {
  defaultIntentBrain,
} from "./intent-brain.service.js";
import type {
  IntentBrainInput,
} from "./intent-brain.types.js";

export async function intentBrainRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: IntentBrainInput;
  }>(
    "/api/v1/intent-brain/analyze",
    async (request) =>
      defaultIntentBrain.analyze(
        request.body,
      ),
  );

  app.get(
    "/api/v1/intent-brain/preset",
    async () => ({
      input: {
        message:
          "No sé qué regalarle a mi padre, dame ideas",
        conversationState:
          "DISCOVERY",
        hasCandidates:
          false,
        hasProposals:
          false,
      },
    }),
  );
}
