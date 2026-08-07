import type { FastifyInstance } from "fastify";
import type { ProviderConnectionConfig } from "../provider-engine/provider-types.js";
import { getProvider } from "../provider-engine/provider-registry.js";
import { resolveMakitoConfig, type MakitoApiConfig } from "../provider-engine/makito-client.js";
import type { MakitoSyncOptions } from "../provider-engine/makito-sync.js";
import { catalogImportService } from "./catalog-import.service.js";

interface ImportBody {
  config?: ProviderConnectionConfig | Partial<MakitoApiConfig>;
  limit?: number;
  updatedSince?: string;
  batchSize?: number;
  markMissingInactive?: boolean;
  saveSnapshot?: boolean;
  buildKnowledge?: boolean;
  classifyProducts?: boolean;
  forceClassification?: boolean;
  importMedia?: boolean;
  forceMedia?: boolean;
  mediaConcurrency?: number;
  options?: MakitoSyncOptions;
}

function providerConfig(provider: string, body: ImportBody): ProviderConnectionConfig | MakitoApiConfig {
  if (provider === "makito") return resolveMakitoConfig(body.config as Partial<MakitoApiConfig> | undefined);
  const config = body.config as ProviderConnectionConfig | undefined;
  if (!config?.baseUrl) throw new Error("Falta config.baseUrl.");
  return config;
}

export async function catalogImportRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { provider: string }; Body: ImportBody }>("/catalog-imports/:provider", async (request, reply) => {
    const provider = request.params.provider;
    getProvider(provider);
    const body = request.body ?? {};
    const job = catalogImportService.start({
      provider,
      config: providerConfig(provider, body),
      limit: body.limit,
      updatedSince: body.updatedSince,
      batchSize: body.batchSize,
      markMissingInactive: body.markMissingInactive === true,
      saveSnapshot: body.saveSnapshot !== false,
      buildKnowledge: body.buildKnowledge !== false,
      classifyProducts: body.classifyProducts !== false,
      forceClassification: body.forceClassification === true,
      importMedia: body.importMedia !== false,
      forceMedia: body.forceMedia === true,
      mediaConcurrency: body.mediaConcurrency,
      makitoOptions: body.options,
    });
    return reply.code(202).send({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      statusUrl: `/api/v1/jobs/${job.id}`,
    });
  });

  app.get<{ Querystring: { provider?: string } }>("/catalog-imports", async request => ({
    items: await catalogImportService.list(request.query.provider),
  }));

  app.get<{ Params: { jobId: string } }>("/catalog-imports/:jobId", async (request, reply) => {
    const job = await catalogImportService.get(request.params.jobId);
    if (!job) return reply.code(404).send({ error: "IMPORT_JOB_NOT_FOUND", message: "Trabajo de importación no encontrado." });
    return job;
  });
}
