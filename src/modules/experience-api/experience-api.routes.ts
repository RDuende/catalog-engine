import type { FastifyInstance, FastifyRequest } from "fastify";
import { MvpConversationOwnershipError, type MvpConversationOwnerKind, type MvpConversationPrincipal } from "../mvp-orchestrator/index.js";
import { JourneyExperienceNotFoundError } from "./experience-api.errors.js";
import type { ExperienceApiService } from "./experience-api.service.js";
import type { ExperienceWorkspaceService } from "./experience-workspace.service.js";
import type { ExperienceWorkspaceKind, SaveExperienceWorkspaceInput } from "./experience-workspace.types.js";
import type { PrepareExperiencePurchaseIntentInput } from "./experience-purchase-intent.types.js";

function header(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function principalFrom(request: FastifyRequest): MvpConversationPrincipal | undefined {
  const rawKind = header(request, "x-mvp-owner-type")?.toUpperCase();
  const id = header(request, "x-mvp-owner-id");
  const accessToken = header(request, "x-mvp-access-token");
  if (!rawKind && !id && !accessToken) return undefined;
  if (!rawKind || !id || !["USER", "GUEST", "VOUCHER"].includes(rawKind)) {
    throw new MvpConversationOwnershipError("MVP_CONVERSATION_AUTH_REQUIRED", "Las cabeceras de propietario no son válidas.");
  }
  return { kind: rawKind as MvpConversationOwnerKind, id, ...(accessToken ? { accessToken } : {}) };
}

export async function experienceApiRoutes(
  app: FastifyInstance,
  service: ExperienceApiService,
  workspace: ExperienceWorkspaceService = service.workspaceService,
): Promise<void> {
  app.get<{ Params: { journeyId: string } }>("/experience/:journeyId", async (request, reply) => {
    try {
      return reply.send(await service.getByJourney(request.params.journeyId, principalFrom(request)));
    } catch (error) {
      if (error instanceof JourneyExperienceNotFoundError) {
        return reply.code(404).send({ error: "JOURNEY_EXPERIENCE_NOT_FOUND", message: error.message });
      }
      if (error instanceof MvpConversationOwnershipError) {
        return reply.code(error.code === "MVP_CONVERSATION_AUTH_REQUIRED" ? 401 : 403).send({ error: error.code, message: error.message });
      }
      throw error;
    }
  });
  app.get<{ Params: { journeyId: string } }>("/experience/:journeyId/workspace", async (request, reply) => {
    try {
      return reply.send(await workspace.get(request.params.journeyId, principalFrom(request)));
    } catch (error) {
      if (error instanceof JourneyExperienceNotFoundError) return reply.code(404).send({ error: "JOURNEY_EXPERIENCE_NOT_FOUND", message: error.message });
      if (error instanceof MvpConversationOwnershipError) return reply.code(error.code === "MVP_CONVERSATION_AUTH_REQUIRED" ? 401 : 403).send({ error: error.code, message: error.message });
      throw error;
    }
  });

  app.put<{ Params: { journeyId: string; kind: ExperienceWorkspaceKind }; Body: SaveExperienceWorkspaceInput }>(
    "/experience/:journeyId/workspace/:kind",
    async (request, reply) => {
      try {
        return reply.send(await workspace.save(request.params.journeyId, request.params.kind, request.body, principalFrom(request)));
      } catch (error) {
        if (error instanceof JourneyExperienceNotFoundError) return reply.code(404).send({ error: "JOURNEY_EXPERIENCE_NOT_FOUND", message: error.message });
        if (error instanceof MvpConversationOwnershipError) return reply.code(error.code === "MVP_CONVERSATION_AUTH_REQUIRED" ? 401 : 403).send({ error: error.code, message: error.message });
        throw error;
      }
    },
  );


  app.get<{ Params: { journeyId: string } }>(
    "/experience/:journeyId/purchase-intents",
    async (request, reply) => {
      try {
        return reply.send({
          purchaseIntents:
            await service.purchaseIntentService.list(
              request.params.journeyId,
              principalFrom(request),
            ),
        });
      } catch (error) {
        if (error instanceof JourneyExperienceNotFoundError) {
          return reply.code(404).send({
            error: "JOURNEY_EXPERIENCE_NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof MvpConversationOwnershipError) {
          return reply
            .code(
              error.code === "MVP_CONVERSATION_AUTH_REQUIRED"
                ? 401
                : 403,
            )
            .send({
              error: error.code,
              message: error.message,
            });
        }
        throw error;
      }
    },
  );

  app.post<{
    Params: { journeyId: string };
    Body: PrepareExperiencePurchaseIntentInput;
  }>(
    "/experience/:journeyId/purchase-intents",
    async (request, reply) => {
      try {
        const intent =
          await service.purchaseIntentService.prepare(
            request.params.journeyId,
            request.body,
            principalFrom(request),
          );
        return reply.code(201).send({ purchaseIntent: intent });
      } catch (error) {
        if (error instanceof JourneyExperienceNotFoundError) {
          return reply.code(404).send({
            error: "JOURNEY_EXPERIENCE_NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof MvpConversationOwnershipError) {
          return reply
            .code(
              error.code === "MVP_CONVERSATION_AUTH_REQUIRED"
                ? 401
                : 403,
            )
            .send({
              error: error.code,
              message: error.message,
            });
        }
        return reply.code(400).send({
          error: "PURCHASE_INTENT_INVALID",
          message:
            error instanceof Error
              ? error.message
              : "Purchase Intent no válido.",
        });
      }
    },
  );

  app.post<{
    Params: { journeyId: string; intentId: string };
  }>(
    "/experience/:journeyId/purchase-intents/:intentId/commit",
    async (request, reply) => {
      try {
        return reply.send(
          await service.purchaseIntentService.commit(
            request.params.journeyId,
            request.params.intentId,
            principalFrom(request),
          ),
        );
      } catch (error) {
        if (error instanceof JourneyExperienceNotFoundError) {
          return reply.code(404).send({
            error: "JOURNEY_EXPERIENCE_NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof MvpConversationOwnershipError) {
          return reply
            .code(
              error.code === "MVP_CONVERSATION_AUTH_REQUIRED"
                ? 401
                : 403,
            )
            .send({
              error: error.code,
              message: error.message,
            });
        }
        return reply.code(400).send({
          error: "PURCHASE_INTENT_COMMIT_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo confirmar la compra.",
        });
      }
    },
  );

}
