import type { FastifyInstance } from "fastify";
import { ArtifactNotFoundError, type ArtifactType } from "../artifact-domain/index.js";
import type { ArtifactService } from "./artifact-service.js";

interface CreateArtifactBody {
  readonly journeyId: string;
  readonly type: ArtifactType;
  readonly fileName: string;
  readonly contentBase64: string;
  readonly title?: string;
  readonly mimeType?: string;
  readonly metadata?: Record<string, unknown>;
}

export async function artifactRoutes(app: FastifyInstance, service: ArtifactService) {
  app.post<{ Body: CreateArtifactBody }>("/artifacts", async (request, reply) => {
    const body = request.body;
    if (!body?.journeyId || !body.type || !body.fileName || !body.contentBase64) {
      return reply.code(400).send({ error: "ARTIFACT_INVALID_INPUT", message: "Faltan datos obligatorios." });
    }
    const content = Buffer.from(body.contentBase64, "base64");
    if (content.byteLength === 0) {
      return reply.code(400).send({ error: "ARTIFACT_EMPTY_CONTENT", message: "El contenido está vacío." });
    }
    const result = await service.create({
      journeyId: body.journeyId,
      type: body.type,
      fileName: body.fileName,
      content,
      title: body.title,
      mimeType: body.mimeType,
      metadata: body.metadata,
    });
    return reply.code(201).send(result);
  });

  app.get<{ Params: { journeyId: string }; Querystring: { type?: ArtifactType } }>(
    "/journeys/:journeyId/artifacts",
    async (request) => ({ artifacts: await service.listByJourney(request.params.journeyId, request.query.type) }),
  );

  app.get<{ Params: { artifactId: string } }>("/artifacts/:artifactId", async (request, reply) => {
    try { return { artifact: await service.get(request.params.artifactId) }; }
    catch (error) {
      if (error instanceof ArtifactNotFoundError) return reply.code(404).send({ error: error.code, message: error.message });
      throw error;
    }
  });

  app.get<{ Params: { artifactId: string } }>("/artifacts/:artifactId/content", async (request, reply) => {
    try {
      const result = await service.readContent(request.params.artifactId);
      if (result.artifact.mimeType) reply.type(result.artifact.mimeType);
      return reply.send(Buffer.from(result.content));
    } catch (error) {
      if (error instanceof ArtifactNotFoundError) return reply.code(404).send({ error: error.code, message: error.message });
      throw error;
    }
  });

  app.delete<{ Params: { artifactId: string } }>("/artifacts/:artifactId", async (request, reply) => {
    const deleted = await service.delete(request.params.artifactId);
    return deleted ? reply.code(204).send() : reply.code(404).send({ error: "ARTIFACT_NOT_FOUND" });
  });
}
