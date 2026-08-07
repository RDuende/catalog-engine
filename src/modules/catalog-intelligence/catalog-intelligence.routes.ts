import type { FastifyInstance } from "fastify";
import type { CatalogIntelligenceService } from "./catalog-intelligence.service.js";
import type { ProductBrainCorrection } from "./product-brain-studio.types.js";

export async function catalogIntelligenceRoutes(app: FastifyInstance, service: CatalogIntelligenceService) {
  app.get("/catalog-intelligence/stats", async () => service.stats());
  app.get("/catalog-intelligence/products", async (request) => {
    const q = request.query as Record<string, string | undefined>;
    return service.list({ q: q.q, provider: q.provider, status: q.status, objectType: q.objectType, interest: q.interest, limit: q.limit ? Number(q.limit) : undefined, offset: q.offset ? Number(q.offset) : undefined });
  });
  app.get("/catalog-intelligence/products/:productId", async (request, reply) => {
    const { productId } = request.params as { productId: string }; const product = await service.get(productId);
    return product ?? reply.code(404).send({ error: "NOT_FOUND", message: "Producto no encontrado." });
  });
  app.post("/catalog-intelligence/products/:productId/reclassify", async (request, reply) => {
    const { productId } = request.params as { productId: string }; const brain = await service.reclassify(productId);
    return brain ? { brain } : reply.code(404).send({ error: "NOT_FOUND", message: "Producto no encontrado." });
  });
  app.get("/catalog-intelligence/products/:productId/studio", async (request, reply) => {
    const { productId } = request.params as { productId: string }; const result = await service.studio(productId);
    return result ?? reply.code(404).send({ error: "NOT_FOUND", message: "Producto no encontrado." });
  });
  app.post("/catalog-intelligence/products/:productId/studio/preview", async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const result = await service.preview(productId, (request.body ?? {}) as ProductBrainCorrection);
    return result ?? reply.code(404).send({ error: "NOT_FOUND", message: "Producto no encontrado." });
  });
  app.post("/catalog-intelligence/products/:productId/studio/teach", async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const body = (request.body ?? {}) as ProductBrainCorrection & { actor?: string };
    const result = await service.teach(productId, body, body.actor ?? "admin");
    return result ?? reply.code(404).send({ error: "NOT_FOUND", message: "Producto no encontrado." });
  });
  app.post("/catalog-intelligence/products/:productId/studio/revert/:historyId", async (request, reply) => {
    const { productId, historyId } = request.params as { productId: string; historyId: string };
    const body = (request.body ?? {}) as { actor?: string };
    const result = await service.revert(productId, historyId, body.actor ?? "admin");
    return result ?? reply.code(404).send({ error: "NOT_FOUND", message: "No se pudo revertir esa versión." });
  });
  app.post("/catalog-intelligence/diagnose", async (request) => service.diagnose((request.body ?? {}) as { interests?: string[]; budget?: number; age?: number; limit?: number }));
}
