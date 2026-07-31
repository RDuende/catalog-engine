import type { FastifyInstance } from "fastify";
import { listProviders, getProvider } from "./provider-registry.js";
import { previewProvider, syncProvider } from "./provider-service.js";
import type { ProviderConnectionConfig } from "./provider-types.js";
import { diagnoseMakitoEndpoint, getMakitoRateLimitStatus, resolveMakitoConfig, type MakitoApiConfig } from "./makito-client.js";
import { syncMakitoSnapshot, type MakitoSyncOptions } from "./makito-sync.js";
import { importCanonicalProducts } from "../canonical-catalog/index.js";
import { jobManager, providerSyncPipeline, snapshotService } from "../core-sync/index.js";

function configFrom(body: unknown): ProviderConnectionConfig {
  if (!body || typeof body !== "object") throw new Error("Configuración no válida.");
  const config = (body as { config?: ProviderConnectionConfig }).config;
  if (!config?.baseUrl) throw new Error("Falta config.baseUrl.");
  return config;
}

function makitoConfigFrom(body: unknown): MakitoApiConfig {
  const config = body && typeof body === "object" ? (body as { config?: Partial<MakitoApiConfig> }).config : undefined;
  return resolveMakitoConfig(config);
}

export async function providerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/providers", async () => listProviders().map(p => ({ key: p.key, name: p.name, description: p.description })));
  app.post<{ Params: { provider: string }; Body: { config: ProviderConnectionConfig } }>("/providers/:provider/test", async request => {
    const config = request.params.provider === "makito" ? makitoConfigFrom(request.body) : configFrom(request.body);
    return getProvider(request.params.provider).testConnection(config);
  });
  app.post<{ Params: { provider: string }; Body: { config: ProviderConnectionConfig; limit?: number } }>("/providers/:provider/preview", async request => {
    const config = request.params.provider === "makito" ? makitoConfigFrom(request.body) : configFrom(request.body);
    return { items: await previewProvider(request.params.provider, config, request.body?.limit) };
  });
  app.post<{ Params: { provider: string }; Body: { config?: ProviderConnectionConfig; limit?: number; updatedSince?: string; importCanonical?: boolean; saveSnapshot?: boolean; markMissingInactive?: boolean; batchSize?: number; options?: MakitoSyncOptions } }>("/providers/:provider/sync", async (request, reply) => {
    const provider = request.params.provider;
    const config = provider === "makito" ? makitoConfigFrom(request.body) : configFrom(request.body);
    // Validate the provider before accepting the asynchronous job.
    getProvider(provider);
    const job = jobManager.create(providerSyncPipeline, {
      type: "PROVIDER_SYNC",
      provider,
      input: {
        provider,
        config,
        limit: request.body?.limit,
        updatedSince: request.body?.updatedSince,
        importCanonical: request.body?.importCanonical !== false,
        makitoOptions: request.body?.options,
        saveSnapshot: request.body?.saveSnapshot !== false,
        markMissingInactive: request.body?.markMissingInactive === true,
        batchSize: request.body?.batchSize,
      },
      metadata: { requestedAt: new Date().toISOString() },
    });
    return reply.code(202).send({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      statusUrl: `/api/v1/jobs/${job.id}`,
    });
  });

  app.post<{ Params: { provider: string }; Body: { config: ProviderConnectionConfig; limit?: number; updatedSince?: string } }>("/providers/:provider/sync-now", async request => {
    const config = request.params.provider === "makito" ? makitoConfigFrom(request.body) : configFrom(request.body);
    return syncProvider(request.params.provider, config, { limit: request.body?.limit, updatedSince: request.body?.updatedSince });
  });

  app.post<{ Params: { provider: string }; Body: { config: ProviderConnectionConfig; limit?: number; updatedSince?: string } }>("/providers/:provider/sync-canonical", async request => {
    const config = request.params.provider === "makito" ? makitoConfigFrom(request.body) : configFrom(request.body);
    const sync = await syncProvider(request.params.provider, config, { limit: request.body?.limit, updatedSince: request.body?.updatedSince });
    const canonical = await importCanonicalProducts(request.params.provider, sync.products);
    return { sync: { ...sync, products: undefined }, canonical };
  });


  app.get<{ Params: { provider: string } }>("/providers/:provider/last-report", async (request, reply) => {
    const report = await snapshotService.lastReport(request.params.provider);
    if (!report) return reply.code(404).send({ error: "REPORT_NOT_FOUND", message: "Todavía no existe un informe para este proveedor." });
    return report;
  });

  app.get<{ Params: { provider: string }; Querystring: { limit?: string } }>("/providers/:provider/snapshots", async request => ({
    provider: request.params.provider,
    snapshots: await snapshotService.list(request.params.provider, Number(request.query?.limit ?? 20)),
  }));

  app.get<{ Params: { provider: string }; Querystring: { limit?: string } }>("/providers/:provider/reports", async request => ({
    provider: request.params.provider,
    reports: await snapshotService.listReports(request.params.provider, Number(request.query?.limit ?? 20)),
  }));

  app.post<{ Params: { provider: string }; Body: { keep?: number; maxAgeDays?: number } }>("/providers/:provider/snapshots/cleanup", async request => ({
    provider: request.params.provider,
    ...(await snapshotService.cleanup(request.params.provider, request.body)),
  }));

  app.get("/providers/makito/status", async () => ({
    provider: "makito",
    configured: Boolean(process.env.MAKITO_CLIENT_ID && process.env.MAKITO_CLIENT_SECRET),
    baseUrl: process.env.MAKITO_API_BASE_URL ?? "https://apis.makito.es",
    credentialsExposed: false,
    rateLimit: getMakitoRateLimitStatus()
  }));

  app.post<{ Body: { config?: Partial<MakitoApiConfig>; options?: MakitoSyncOptions } }>("/providers/makito/snapshot", async request => {
    return syncMakitoSnapshot(request.body?.config, request.body?.options);
  });

  app.post<{ Body: { config?: Partial<MakitoApiConfig>; path?: string; query?: Record<string, string | undefined> } }>("/providers/makito/debug", async request => {
    return diagnoseMakitoEndpoint(
      request.body?.config,
      request.body?.path ?? "/catalog/files",
      request.body?.query ?? { format: "JSON", lang: "es" }
    );
  });
}
