import Fastify, { type FastifyError } from "fastify";
import { env } from "./config/env.js";
import { CATALOG_ENGINE_NAME, CATALOG_ENGINE_VERSION } from "./version.js";
import { catalogRoutes } from "./modules/catalog/index.js";
import { knowledgeRoutes } from "./modules/knowledge/index.js";
import { importRoutes } from "./modules/import-engine/index.js";
import { intentRoutes } from "./modules/intent-api/index.js";
import { raiRoutes } from "./modules/rai-api/index.js";
import { raiPlaygroundRoutes } from "./modules/rai-playground/index.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.logLevel,
    },
  });

  app.get("/", async () => ({
    name: CATALOG_ENGINE_NAME,
    version: CATALOG_ENGINE_VERSION,
    status: "running",
  }));

  app.get("/health", async () => ({
    status: "ok",
    version: CATALOG_ENGINE_VERSION,
    timestamp: new Date().toISOString(),
  }));

  app.get("/version", async () => ({
    name: CATALOG_ENGINE_NAME,
    version: CATALOG_ENGINE_VERSION,
  }));

  app.register(catalogRoutes, { prefix: "/api/v1" });
  app.register(knowledgeRoutes, { prefix: "/api/v1" });
  app.register(importRoutes, { prefix: "/api/v1" });
  app.register(intentRoutes, { prefix: "/api/v1" });
  app.register(raiRoutes, { prefix: "/api/v1" });
  app.register(raiPlaygroundRoutes);

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({
      error: "NOT_FOUND",
      message: "Ruta no encontrada.",
    });
  });

  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.validation) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: "Los datos enviados no son válidos.",
        details: error.validation,
      });
    }

    return reply.code(error.statusCode ?? 500).send({
      error: "INTERNAL_ERROR",
      message: env.nodeEnv === "production"
        ? "Se ha producido un error interno."
        : error.message,
    });
  });

  return app;
}
