import type { FastifyInstance } from "fastify";
import type { SmartCatalogContext } from "./smart-catalog.types.js";
import type { SmartCatalogService } from "./smart-catalog.service.js";

export async function smartCatalogRoutes(app: FastifyInstance, service: SmartCatalogService) {
  app.get("/smart-catalog/products", async () => ({ products: await service.listProducts() }));
  app.post<{ Body: SmartCatalogContext & { readonly limit?: number } }>("/smart-catalog/recommendations", async (request) => ({
    recommendations: await service.recommend(request.body, request.body.limit ?? 6),
  }));
}
