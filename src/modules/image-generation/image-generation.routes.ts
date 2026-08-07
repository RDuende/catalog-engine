import type { FastifyInstance } from "fastify";
import type { ArtifactService } from "../artifact-service/index.js";
import type { InMemoryTaskManager } from "../task-manager/index.js";
import { ImageGenerationService } from "./image-generation.service.js";
import type { CreateImageGenerationTaskInput } from "./image-generation.types.js";

export async function imageGenerationRoutes(
  app: FastifyInstance,
  manager: InMemoryTaskManager,
  artifactService?: ArtifactService,
) {
  const service = new ImageGenerationService(manager, undefined, artifactService);

  app.post<{ Body: CreateImageGenerationTaskInput }>("/images/generations", async (request, reply) => {
    const task = service.createTask(request.body);
    return reply.code(202).send({
      taskId: task.id,
      state: task.state,
      streamUrl: `/api/v1/tasks/${task.id}/stream`,
      statusUrl: `/api/v1/tasks/${task.id}`,
      cancelUrl: `/api/v1/tasks/${task.id}/cancel`,
      journeyId: request.body.brief.journeyId,
    });
  });
}
