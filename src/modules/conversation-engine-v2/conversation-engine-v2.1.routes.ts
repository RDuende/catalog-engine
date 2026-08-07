import type {
  FastifyInstance,
} from "fastify";

import {
  defaultConversationEngineV21,
} from "./conversation-engine-v2.1.service.js";
import type {
  ConversationEngineInput,
} from "./conversation-engine.types.js";

export async function
conversationEngineV21Routes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body:
      ConversationEngineInput;
  }>(
    "/api/v2/conversation/process-natural",
    async (request) =>
      defaultConversationEngineV21
        .process(
          request.body,
        ),
  );

  app.get(
    "/api/v2/conversation/natural-preset",
    async () => ({
      input: {
        conversationId:
          "demo-natural",
        message:
          "Es para mi padre, cumple 55 años, le encanta el motocross y tengo unos 70 euros",
        candidates: [
          {
            id: "p1",
            name:
              "Termo personalizado motocross",
            category:
              "botellas",
            price: 24,
            stock: 20,
            score: 0.9,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
            marginPercent: 55,
            bundleRoles:
              ["HERO"],
          },
          {
            id: "p2",
            name:
              "Llavero personalizado",
            category:
              "llaveros",
            price: 9,
            stock: 50,
            score: 0.78,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
            marginPercent: 60,
            bundleRoles:
              ["COMPLEMENT"],
          },
        ],
      },
    }),
  );
}
