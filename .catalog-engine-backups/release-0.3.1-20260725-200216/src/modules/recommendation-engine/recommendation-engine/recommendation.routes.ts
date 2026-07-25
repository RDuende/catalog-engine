import type { FastifyInstance } from "fastify";
import { RecommendationBodySchema, type RecommendationBody } from "./recommendation.schemas.js";
import { recommendProducts } from "./recommendation.service.js";

export async function recommendationRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RecommendationBody }>(
    "/recommendations",
    { schema: { body: RecommendationBodySchema } },
    async (request) => recommendProducts(request.body)
  );
}
