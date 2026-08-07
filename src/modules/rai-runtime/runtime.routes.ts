import type { FastifyInstance } from "fastify";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import { env } from "../../config/env.js";
import { RaiRuntimeService } from "./runtime.service.js";
import { runtimeContextRequestSchema, runtimeRequestSchema } from "./runtime.schemas.js";
import type { RuntimeContextRequest } from "./runtime-context-request.js";
import type { RuntimeRequest } from "./runtime.types.js";
import {
  RuntimeLegacyEntryPointDisabledError,
  resolveRuntimeLegacyEntryPointPolicy,
} from "./runtime-legacy-policy.js";

export async function raiRuntimeRoutes(app: FastifyInstance) {
  const legacyPolicy = resolveRuntimeLegacyEntryPointPolicy({
    setting: env.raiRuntimeLegacyEntryPoints,
    environment: env.appEnvironment,
  });
  const runtime = new RaiRuntimeService(undefined, undefined, undefined, legacyPolicy, {
    observationHours: env.raiRuntimeRetirementObservationHours,
    minimumCanonicalCalls: env.raiRuntimeRetirementMinimumCanonicalCalls,
  });

  app.get("/rai-runtime/status", async () => runtime.status());
  app.get("/rai-runtime/retirement-readiness", async () =>
    runtime.status().entryPoints.retirementReadiness,
  );

  app.post<{ Body: RuntimeContextRequest }>(
    "/rai-runtime/interact",
    { schema: { body: runtimeContextRequestSchema } },
    async (request) => {
      const context = createRaiContext({
        message: request.body.message,
        sessionId: request.body.sessionId,
        requestId: request.body.requestId ?? request.id,
        correlationId: request.body.correlationId,
        state: request.body.state,
        actor: request.body.actor,
        project: request.body.project,
        facts: request.body.context,
        metadata: request.body.metadata,
      });

      return runtime.runContext({
        context,
        goal: request.body.goal,
        limit: request.body.limit,
        recommendNow: request.body.recommendNow,
      });
    },
  );

  app.post<{ Body: RuntimeRequest }>("/rai-runtime/run", { schema: { body: runtimeRequestSchema } }, async (request, reply) => {
    reply
      .header("Deprecation", "true")
      .header("Sunset", "Tue, 01 Dec 2026 00:00:00 GMT")
      .header("Link", '</rai-runtime/interact>; rel="successor-version"')
      .header("Warning", '299 - "Deprecated endpoint: use POST /rai-runtime/interact"');
    try {
      return await runtime.run(request.body);
    } catch (error) {
      if (error instanceof RuntimeLegacyEntryPointDisabledError) {
        return reply.code(error.statusCode).send({
          error: error.code,
          message: error.message,
          successor: "/rai-runtime/interact",
        });
      }
      throw error;
    }
  });
}
