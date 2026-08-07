import type { FastifyInstance } from "fastify";
import { PlatformSettingsService } from "./platform-settings.service.js";

export async function platformSettingsRoutes(app: FastifyInstance, service = new PlatformSettingsService()) {
  app.get("/platform-settings", async () => service.getPublic());
  app.patch("/platform-settings", async (request, reply) => {
    try { return await service.update((request.body ?? {}) as Record<string, unknown>); }
    catch (error) { return reply.code(400).send({ error:"INVALID_SETTINGS", message:error instanceof Error ? error.message : "Configuración no válida." }); }
  });
  app.post("/platform-settings/reset", async (request, reply) => {
    try {
      const body = (request.body ?? {}) as { keys?: readonly string[] };
      return await service.reset(body.keys);
    } catch (error) { return reply.code(400).send({ error:"INVALID_SETTINGS", message:error instanceof Error ? error.message : "No se pudo restablecer." }); }
  });
}
