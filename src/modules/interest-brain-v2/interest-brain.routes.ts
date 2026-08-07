import type {
  FastifyInstance,
} from "fastify";

import {
  defaultInterestBrainV2,
} from "./interest-brain.service.js";
import type {
  InterestBrainInput,
} from "./interest-brain.types.js";

export async function
interestBrainV2Routes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: InterestBrainInput;
  }>(
    "/api/v2/interest-brain/analyze",
    async (request) =>
      defaultInterestBrainV2.analyze(
        request.body,
      ),
  );

  app.get(
    "/api/v2/interest-brain/preset",
    async () => ({
      input: {
        message:
          "Le encanta el monte, hacer rutas y la fotografía",
        interests: [
          "madera",
        ],
      },
    }),
  );
}
