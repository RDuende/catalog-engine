import type {
  FastifyInstance,
} from "fastify";

import {
  defaultEmotionBrain,
} from "./emotion-brain.service.js";
import type {
  EmotionBrainInput,
} from "./emotion-brain.types.js";

export async function emotionBrainRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: EmotionBrainInput;
  }>(
    "/api/v1/emotion-brain/analyze",
    async (request) =>
      defaultEmotionBrain.analyze(
        request.body,
      ),
  );

  app.get(
    "/api/v1/emotion-brain/preset",
    async () => ({
      input: {
        message:
          "Quiero agradecerle todo lo que ha hecho por mí y emocionarlo mucho.",
        occasion:
          "cumpleaños",
        relationship:
          "muy cercana",
        desiredImpact: [
          "emocionar",
          "agradecer",
        ],
      },
    }),
  );
}
