import type {
  FastifyInstance,
} from "fastify";

import {
  defaultAdminTools,
} from "./admin-tools.service.js";

export async function adminToolsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/api/v1/admin-tools",
    async () => ({
      tools:
        defaultAdminTools.list(),
    }),
  );

  app.get<{
    Params: {
      toolId: string;
    };
  }>(
    "/api/v1/admin-tools/:toolId",
    async (request, reply) => {
      const tool =
        defaultAdminTools.get(
          request.params.toolId,
        );

      if (!tool) {
        return reply.code(404).send({
          error:
            "Herramienta no encontrada.",
        });
      }

      return { tool };
    },
  );

  app.post<{
    Params: {
      toolId: string;
    };
    Body: unknown;
  }>(
    "/api/v1/admin-tools/:toolId/run",
    async (request) =>
      defaultAdminTools.run(
        request.params.toolId,
        request.body,
      ),
  );

  app.post<{
    Params: {
      toolId: string;
    };
  }>(
    "/api/v1/admin-tools/:toolId/test",
    async (request, reply) => {
      try {
        return await defaultAdminTools
          .runTest(
            request.params.toolId,
          );
      } catch (error) {
        return reply.code(400).send({
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );

  app.get(
    "/api/v1/admin-tools-diagnostic",
    async () =>
      defaultAdminTools.diagnostic(),
  );
}
