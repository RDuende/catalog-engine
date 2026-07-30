import type { FastifyInstance } from "fastify";
import { CanonicalCatalogRepository } from "./canonical-repository.js";
import { importCanonicalProducts } from "./canonical-service.js";

export async function canonicalCatalogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/canonical/status", async () => ({ module: "canonical-catalog", version: "1", databaseConfigured: Boolean(process.env.DATABASE_URL) }));
  app.get<{ Querystring: { providerKey?: string; status?: string; q?: string; limit?: string; offset?: string } }>("/canonical/products", async request => {
    const repository = new CanonicalCatalogRepository();
    return { items: await repository.list({ ...request.query, limit: Number(request.query.limit || 50), offset: Number(request.query.offset || 0) }) };
  });
  app.get("/canonical/stats", async () => new CanonicalCatalogRepository().stats());
  app.post<{ Body: { providerKey: string; products: unknown[] } }>("/canonical/products/import", async request => {
    if (!request.body?.providerKey) throw new Error("Falta providerKey.");
    if (!Array.isArray(request.body.products)) throw new Error("products debe ser un array.");
    return importCanonicalProducts(request.body.providerKey, request.body.products);
  });
}
