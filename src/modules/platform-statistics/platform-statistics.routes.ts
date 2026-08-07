import type { FastifyInstance } from "fastify";
import { PlatformStatisticsService } from "./platform-statistics.service.js";

export async function platformStatisticsRoutes(app: FastifyInstance): Promise<void> {
  const service = new PlatformStatisticsService();
  app.get("/platform-statistics", async () => service.snapshot());
}
