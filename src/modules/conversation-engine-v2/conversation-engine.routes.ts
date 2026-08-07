import type {
  FastifyInstance,
} from "fastify";

import {
  defaultConversationEngineV2,
} from "./conversation-engine.service.js";
import type {
  ConversationEngineInput,
} from "./conversation-engine.types.js";

export async function
conversationEngineV2Routes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body:
      ConversationEngineInput;
  }>(
    "/api/v2/conversation/process",
    async (request) =>
      defaultConversationEngineV2
        .process(
          request.body,
        ),
  );

  app.get(
    "/api/v2/conversation/preset",
    async () => ({
      input: {
        conversationId:
          "demo-conversation",
        message:
          "Quiero un regalo para mi padre",
        facts: {
          recipientLabel:
            "mi padre",
          occasion:
            "cumpleaños",
          budget: 70,
          interests: [
            "motocross",
            "madera",
          ],
          personality: [
            "práctico",
          ],
          desiredImpact: [
            "sorprender",
          ],
        },
        autoCompose:
          false,
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
              "Llavero de madera",
            category:
              "llaveros",
            price: 9,
            stock: 50,
            score: 0.78,
            canonicalInterests:
              ["madera"],
            personalizationAvailable:
              true,
            marginPercent: 60,
            bundleRoles:
              ["COMPLEMENT"],
          },
          {
            id: "p3",
            name:
              "Caja de madera",
            category:
              "packaging",
            price: 14,
            stock: 8,
            score: 0.7,
            materials:
              ["madera"],
            personalizationAvailable:
              true,
            marginPercent: 45,
            bundleRoles:
              ["PACKAGING"],
          },
        ],
      },
    }),
  );
}
