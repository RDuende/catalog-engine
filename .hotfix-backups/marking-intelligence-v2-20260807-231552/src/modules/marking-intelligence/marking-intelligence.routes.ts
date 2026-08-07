import type { FastifyInstance } from "fastify";
import {
  collectProviderMarkingEvidence,
  getMarkingProfile,
  saveMarkingProfile,
  techniquesFromEvidence,
} from "./marking-intelligence.service.js";
import type { ProductMarkingProfile } from "./marking-intelligence.types.js";

export async function markingIntelligenceRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { productId: string } }>("/marking-intelligence/products/:productId", async (request) => {
    const profile = await getMarkingProfile(request.params.productId);
    return { status: "ok", productId: request.params.productId, profile: profile ?? null };
  });

  app.put<{ Params: { productId: string }; Body: Omit<ProductMarkingProfile, "productId" | "updatedAt"> }>(
    "/marking-intelligence/products/:productId",
    async (request, reply) => {
      const body = request.body ?? ({} as Omit<ProductMarkingProfile, "productId" | "updatedAt">);
      if (!Array.isArray(body.areas)) return reply.code(400).send({ error: "areas debe ser un array" });
      const profile = await saveMarkingProfile({ ...body, productId: request.params.productId });
      return reply.send({ status: "saved", profile });
    },
  );

  app.post<{ Params: { productId: string }; Body: { providerKey?: string; raw?: unknown } }>(
    "/marking-intelligence/products/:productId/discover",
    async (request) => {
      const evidence = collectProviderMarkingEvidence(request.body?.raw);
      const techniques = techniquesFromEvidence(evidence);
      return { status: "discovered", productId: request.params.productId, providerKey: request.body?.providerKey, evidence, techniques };
    },
  );
}
