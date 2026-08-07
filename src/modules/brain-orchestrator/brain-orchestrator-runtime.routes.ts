import type {
  FastifyInstance,
} from "fastify";

import {
  defaultBrainOrchestratorRuntime,
} from "./brain-orchestrator-runtime.service.js";
import type {
  BrainOrchestratorInput,
} from "./brain-orchestrator.types.js";

export async function
brainOrchestratorRuntimeRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: BrainOrchestratorInput;
  }>(
    "/api/v1/brain-orchestrator/runtime/run",
    async (request) =>
      defaultBrainOrchestratorRuntime.run(
        request.body,
      ),
  );
}
