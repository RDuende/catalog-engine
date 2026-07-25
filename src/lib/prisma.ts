import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const adapter = new PrismaPg({
  connectionString: env.databaseUrl
});

declare global {
  // Evita múltiples conexiones durante el hot reload.
  // eslint-disable-next-line no-var
  var __catalogPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__catalogPrisma ??
  new PrismaClient({
    adapter
  });

if (env.nodeEnv !== "production") {
  globalThis.__catalogPrisma = prisma;
}
