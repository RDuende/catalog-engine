import type { FastifyInstance } from "fastify";
import {
  RecommendationBodySchema,
  type RecommendationBody,
} from "./recommendation.schemas.js";
import { RecommendationService } from "./recommendation.service.js";

export interface RecommendationRoutesOptions {
  readonly service?: RecommendationService;
}

export async function recommendationRoutes(
  app: FastifyInstance,
  options: RecommendationRoutesOptions = {},
): Promise<void> {
  const service = options.service ?? new RecommendationService();

  app.post<{ Body: RecommendationBody }>(
    "/recommendations",
    {
      schema: {
        body: RecommendationBodySchema,
      },
    },
    async (request, reply) => {
      const result = await service.recommend(request.body);
      return reply.code(200).send(result);
    },
  );
}
