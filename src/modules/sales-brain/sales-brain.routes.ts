import type { FastifyInstance } from "fastify";
import { CommercialMemoryService } from "../commercial-memory/commercial-memory.service.js";
import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import { SalesBrainRequestSchema, type SalesBrainRequestBody } from "./sales-brain.schemas.js";
import { SalesBrainService } from "./sales-brain.service.js";

export async function salesBrainRoutes(app: FastifyInstance): Promise<void> {
  const service = new SalesBrainService(new RecommendationService({ memory: new CommercialMemoryService() }));
  app.post<{ Body: SalesBrainRequestBody }>("/sales-brain/analyze", { schema: { body: SalesBrainRequestSchema } }, async (request) => service.analyzeWithAI(request.body.message, request.body.context));
  app.post<{ Body: SalesBrainRequestBody }>("/sales-brain/decide", { schema: { body: SalesBrainRequestSchema } }, async (request) => service.decide(request.body));
}
