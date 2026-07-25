import type { FastifyInstance } from "fastify";
import { listImportAdapters } from "./import.registry.js";
import {
  createImportSource,
  listImportJobs,
  listImportSources,
  runImport
} from "./import.service.js";
import {
  CreateImportSourceBodySchema,
  RunImportBodySchema,
  type CreateImportSourceBody,
  type RunImportBody
} from "./import.schemas.js";

export async function importRoutes(app: FastifyInstance) {
  app.get("/imports/adapters", async () => ({ items: listImportAdapters() }));
  app.get("/imports/sources", async () => ({ items: await listImportSources() }));
  app.get("/imports/jobs", async () => ({ items: await listImportJobs() }));

  app.post<{ Body: CreateImportSourceBody }>(
    "/imports/sources",
    { schema: { body: CreateImportSourceBodySchema } },
    async (request, reply) => reply.code(201).send(await createImportSource(request.body))
  );

  app.post<{ Body: RunImportBody }>(
    "/imports/run",
    { schema: { body: RunImportBodySchema } },
    async (request, reply) => reply.code(202).send(await runImport(request.body))
  );
}
