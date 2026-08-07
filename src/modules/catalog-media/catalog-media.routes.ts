import type { FastifyInstance } from "fastify";
import { CatalogMediaService } from "./catalog-media.service.js";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function catalogMediaRoutes(app: FastifyInstance): Promise<void> {
  const service = new CatalogMediaService();
  app.get<{ Params: { providerKey: string; sku: string; filename: string } }>(
    "/catalog-media/:providerKey/:sku/:filename",
    async (request, reply) => {
      try {
        const bytes = await service.storage.read(request.params.providerKey, request.params.sku, request.params.filename);
        const extension = request.params.filename.slice(request.params.filename.lastIndexOf(".")).toLowerCase();
        return reply
          .header("content-type", CONTENT_TYPES[extension] ?? "application/octet-stream")
          .header("cache-control", "public, max-age=31536000, immutable")
          .send(bytes);
      } catch {
        return reply.code(404).send({ error: "CATALOG_MEDIA_NOT_FOUND", message: "Imagen local no encontrada." });
      }
    },
  );
}
