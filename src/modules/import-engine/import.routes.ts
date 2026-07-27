import type { FastifyInstance } from "fastify";
import { analyzeImport } from "./import.analysis.js";
import { listImportAdapters } from "./import.registry.js";
import {
  createImportSource,
  listImportJobs,
  listImportSources,
  getImportJob,
  searchCatalogCandidates,
  runImport
} from "./import.service.js";
import {
  AnalyzeImportBodySchema,
  CreateImportSourceBodySchema,
  RunImportBodySchema,
  SearchCatalogCandidatesBodySchema,
  type AnalyzeImportBody,
  type CreateImportSourceBody,
  type RunImportBody,
  type SearchCatalogCandidatesBody
} from "./import.schemas.js";

export async function importRoutes(app: FastifyInstance) {
  app.get("/imports/adapters", async () => ({ items: listImportAdapters() }));
  app.get("/imports/sources", async () => ({ items: await listImportSources() }));
  app.get("/imports/jobs", async () => ({ items: await listImportJobs() }));
  app.get<{ Params: { jobId: string } }>("/imports/jobs/:jobId", async (request, reply) => {
    const job = await getImportJob(request.params.jobId);
    return job ? job : reply.code(404).send({ error: "IMPORT_JOB_NOT_FOUND" });
  });

  app.post<{ Body: AnalyzeImportBody }>(
    "/imports/analyze",
    { schema: { body: AnalyzeImportBodySchema } },
    async (request) => analyzeImport(request.body)
  );

  app.post<{ Body: CreateImportSourceBody }>(
    "/imports/sources",
    { schema: { body: CreateImportSourceBodySchema } },
    async (request, reply) => reply.code(201).send(await createImportSource(request.body))
  );

  app.post<{ Body: SearchCatalogCandidatesBody }>(
    "/catalog/candidates",
    { schema: { body: SearchCatalogCandidatesBodySchema } },
    async (request) => searchCatalogCandidates(request.body)
  );

  app.post<{ Body: RunImportBody }>(
    "/imports/run",
    { schema: { body: RunImportBodySchema } },
    async (request, reply) => reply.code(202).send(await runImport(request.body))
  );
}
