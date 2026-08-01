import type { FastifyInstance } from "fastify";
import { ProductionPlanSchema } from "./production-intelligence.schemas.js";
import { ProductionIntelligenceService } from "./production-intelligence.service.js";
import type { ProductionPlanInput } from "./production-intelligence.types.js";

export async function productionIntelligenceRoutes(app: FastifyInstance): Promise<void> {
  const service = new ProductionIntelligenceService();
  app.get("/production-intelligence/machines", async () => ({ machines: service.listMachines() }));
  app.post<{ Body: ProductionPlanInput }>("/production-intelligence/plan", { schema: { body: ProductionPlanSchema } }, async (request) => service.plan(request.body));
}
