import "dotenv/config";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { catalogStudioRoutes } from "./modules/catalog-studio/index.js";
import { recommendationRoutes } from "./modules/recommendation-engine/index.js";

const app = buildApp();

async function start() {
  try {
    await prisma.$connect();
    await app.register(recommendationRoutes, { prefix: "/api/v1" });
    await app.register(catalogStudioRoutes);

    await app.listen({
      host: env.host,
      port: env.port,
    });

    app.log.info(`Catalog Engine disponible en http://127.0.0.1:${env.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  app.log.info({ signal }, "Cerrando Catalog Engine");
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

void start();
