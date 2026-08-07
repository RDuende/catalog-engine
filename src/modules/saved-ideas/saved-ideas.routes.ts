import type { FastifyInstance, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import type { SavedIdeaItemType, SavedIdeaOwner, SavedIdeaSnapshot } from "./saved-ideas.types.js";
import { SavedIdeasService } from "./saved-ideas.service.js";

function textHeader(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function ownerFromRequest(request: FastifyRequest): SavedIdeaOwner {
  const wcId = textHeader(request, "x-woocommerce-customer-id");
  const rdgestId = textHeader(request, "x-rdgest-customer-id");
  const email = textHeader(request, "x-customer-email");
  if (rdgestId) return { id: `rdgest:${rdgestId}`, source: "RDGEST", externalId: rdgestId, email };
  if (wcId) return { id: `woocommerce:${wcId}`, source: "WOOCOMMERCE", externalId: wcId, email };
  const guestId = textHeader(request, "x-recuerdarte-guest-id") ?? randomUUID();
  return { id: `guest:${guestId}`, source: "GUEST", externalId: guestId };
}

type AddBody = {
  collectionId?: string; journeyId?: string; collectionTitle?: string; recipientLabel?: string; occasion?: string;
  type: SavedIdeaItemType; productId?: string; bundleId?: string; proposalId?: string; artifactId?: string;
  snapshot: SavedIdeaSnapshot; note?: string;
};

export async function savedIdeasRoutes(app: FastifyInstance, service = new SavedIdeasService()): Promise<void> {
  app.get("/saved-ideas", async (request) => ({ owner: ownerFromRequest(request), collections: await service.list(ownerFromRequest(request)) }));
  app.get<{ Params: { collectionId: string } }>("/saved-ideas/:collectionId", async (request, reply) => {
    const collection = await service.get(ownerFromRequest(request), request.params.collectionId);
    return collection ? { collection } : reply.code(404).send({ error: "NOT_FOUND", message: "Colección no encontrada." });
  });
  app.post<{ Body: { title: string; journeyId?: string; recipientLabel?: string; occasion?: string } }>("/saved-ideas", async (request, reply) => reply.code(201).send({ collection: await service.createCollection(ownerFromRequest(request), request.body) }));
  app.post<{ Body: AddBody }>("/saved-ideas/items", async (request, reply) => reply.code(201).send(await service.addItem(ownerFromRequest(request), request.body)));
  app.delete<{ Params: { collectionId: string; itemId: string } }>("/saved-ideas/:collectionId/items/:itemId", async (request, reply) => {
    const removed = await service.removeItem(ownerFromRequest(request), request.params.collectionId, request.params.itemId);
    return removed ? reply.code(204).send() : reply.code(404).send({ error: "NOT_FOUND", message: "Idea no encontrada." });
  });
  app.delete<{ Params: { collectionId: string } }>("/saved-ideas/:collectionId", async (request, reply) => {
    const removed = await service.deleteCollection(ownerFromRequest(request), request.params.collectionId);
    return removed ? reply.code(204).send() : reply.code(404).send({ error: "NOT_FOUND", message: "Colección no encontrada." });
  });
  app.post<{ Params: { collectionId: string } }>("/saved-ideas/:collectionId/start-journey", async (request) => service.startJourney(ownerFromRequest(request), request.params.collectionId));
  app.post<{ Body: { guestOwnerId: string } }>("/saved-ideas/merge-guest", async (request) => service.mergeGuestInto(ownerFromRequest(request), request.body.guestOwnerId));
}
