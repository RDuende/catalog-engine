import type { FastifyInstance } from "fastify";
import {
  IntentAnalyzeBodySchema,
  IntentRecommendBodySchema,
  type IntentAnalyzeBody,
  type IntentRecommendBody,
} from "./intent.schemas.js";
import { IntentApiService } from "./intent.service.js";

export interface IntentRoutesOptions {
  readonly service?: IntentApiService;
}

export async function intentRoutes(
  app: FastifyInstance,
  options: IntentRoutesOptions = {},
): Promise<void> {
  const service = options.service ?? new IntentApiService();

  app.post<{ Body: IntentAnalyzeBody }>(
    "/intent/analyze",
    { schema: { body: IntentAnalyzeBodySchema } },
    async (request, reply) => reply.code(200).send(service.analyze(request.body)),
  );

  app.post<{ Body: IntentRecommendBody }>(
    "/intent/recommend",
    { schema: { body: IntentRecommendBodySchema } },
    async (request, reply) => reply.code(200).send(await service.recommend(request.body)),
  );
}
