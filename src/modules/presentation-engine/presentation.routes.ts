import type { FastifyInstance } from "fastify";
import { ArtifactNotFoundError } from "../artifact-domain/index.js";
import { PresentationSourceInvalidError, PresentationTemplateNotFoundError } from "./presentation.errors.js";
import type { PresentationService } from "./presentation.service.js";

interface CreatePresentationBody {
  readonly sourceArtifactId: string;
  readonly templateId: string;
  readonly title?: string;
}

export async function presentationRoutes(app: FastifyInstance, service: PresentationService) {
  app.get("/presentations/templates", async () => ({ templates: service.listTemplates() }));

  app.post<{ Body: CreatePresentationBody }>("/presentations", async (request, reply) => {
    const body = request.body;
    if (!body?.sourceArtifactId || !body.templateId) {
      return reply.code(400).send({ error: "PRESENTATION_INVALID_INPUT", message: "Faltan sourceArtifactId o templateId." });
    }
    try {
      return reply.code(201).send(await service.create(body));
    } catch (error) {
      if (error instanceof ArtifactNotFoundError) return reply.code(404).send({ error: error.code, message: error.message });
      if (error instanceof PresentationTemplateNotFoundError) return reply.code(404).send({ error: error.code, message: error.message });
      if (error instanceof PresentationSourceInvalidError) return reply.code(422).send({ error: error.code, message: error.message });
      throw error;
    }
  });

  app.get<{ Params: { journeyId: string } }>("/journeys/:journeyId/presentations", async (request) => ({
    presentations: await service.listByJourney(request.params.journeyId),
  }));
}
