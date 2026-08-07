import type {
  FastifyInstance,
} from "fastify";

import {
  defaultGiftBrain,
} from "./gift-brain.service.js";
import type {
  GiftBrainInput,
} from "./gift-brain.types.js";

export async function giftBrainRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: GiftBrainInput;
  }>(
    "/api/v1/gift-brain/analyze",
    async (request) =>
      defaultGiftBrain.analyze(request.body),
  );

  app.get(
    "/api/v1/gift-brain/preset",
    async () => ({
      input: {
        recipientLabel: "mi padre",
        relationship: "muy cercana",
        occasion: "cumpleaños",
        age: 55,
        budget: 70,
        interests: [
          "motocross",
          "madera",
          "viajes",
        ],
        personality: [
          "práctico",
          "aventurero",
        ],
        desiredImpact: [
          "sorprender",
          "emocionar",
        ],
        recipientCount: 1,
      },
    }),
  );
}
