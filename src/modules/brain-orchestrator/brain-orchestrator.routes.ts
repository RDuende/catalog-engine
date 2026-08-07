import type {
  FastifyInstance,
} from "fastify";

import {
  defaultBrainBenchmark,
} from "./brain-benchmark.service.js";
import {
  defaultBrainOrchestrator,
} from "./brain-orchestrator.service.js";
import {
  defaultBrainReplay,
} from "./brain-replay.service.js";
import {
  BRAIN_STAGES,
} from "./brain-orchestrator.registry.js";
import type {
  BrainOrchestratorInput,
} from "./brain-orchestrator.types.js";

export async function
brainOrchestratorRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/api/v1/brain-orchestrator/stages",
    async () => ({
      stages:
        BRAIN_STAGES,
    }),
  );

  app.get(
    "/api/v1/brain-orchestrator/preset",
    async () => ({
      input: {
        recipientLabel:
          "mi padre",
        occasion:
          "cumpleaños",
        budget: 70,
        interests: [
          "motocross",
          "madera",
        ],
        personality: [
          "práctico",
          "aventurero",
        ],
        desiredImpact: [
          "sorprender",
          "emocionar",
        ],
        recipientCount: 1,
        autoCompose: false,
        candidates: [
          {
            id: "p1",
            name:
              "Termo personalizado motocross",
            category:
              "botellas",
            price: 24,
            stock: 20,
            score: 0.9,
            canonicalInterests:
              ["motocross"],
            personalizationAvailable:
              true,
            marginPercent: 55,
            bundleRoles:
              ["HERO"],
            imageUrl:
              "/placeholder-product.png",
          },
          {
            id: "p2",
            name:
              "Llavero de madera",
            category:
              "llaveros",
            price: 9,
            stock: 50,
            score: 0.78,
            canonicalInterests:
              ["madera"],
            materials:
              ["madera"],
            personalizationAvailable:
              true,
            marginPercent: 60,
            bundleRoles:
              ["COMPLEMENT"],
            imageUrl:
              "/placeholder-product.png",
          },
          {
            id: "p3",
            name:
              "Caja de madera",
            category:
              "packaging",
            price: 14,
            stock: 8,
            score: 0.7,
            materials:
              ["madera"],
            personalizationAvailable:
              true,
            marginPercent: 45,
            bundleRoles:
              ["PACKAGING"],
            imageUrl:
              "/placeholder-product.png",
          },
        ],
      },
    }),
  );

  app.post<{
    Body:
      BrainOrchestratorInput;
  }>(
    "/api/v1/brain-orchestrator/run",
    async (request) => {
      const result =
        await defaultBrainOrchestrator
          .run(request.body);

      defaultBrainReplay
        .remember(
          request.body,
          result,
        );

      return result;
    },
  );

  app.get(
    "/api/v1/brain-orchestrator/replays",
    async () => ({
      records:
        defaultBrainReplay.list(),
    }),
  );

  app.post<{
    Params: {
      runId: string;
    };
  }>(
    "/api/v1/brain-orchestrator/replays/:runId",
    async (
      request,
      reply,
    ) => {
      try {
        return await defaultBrainReplay
          .replay(
            request.params.runId,
          );
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
      }
    },
  );

  app.post<{
    Body: {
      readonly input:
        BrainOrchestratorInput;
      readonly runs?: number;
    };
  }>(
    "/api/v1/brain-orchestrator/benchmark",
    async (request) =>
      defaultBrainBenchmark
        .run(
          request.body.input,
          request.body.runs,
        ),
  );
}
