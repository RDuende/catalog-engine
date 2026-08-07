import type { FastifyInstance } from "fastify";
import { defaultPlatformHealth } from "./platform-health.service.js";
import { PLATFORM_MODULES } from "./platform-module.registry.js";

export async function platformHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/platform-foundation/modules", async () => ({ modules: PLATFORM_MODULES }));
  app.get("/api/v1/platform-foundation/health", async () => defaultPlatformHealth.snapshot());
}