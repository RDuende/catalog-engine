import type { JobRecord } from "../core-sync/index.js";
import { jobManager, jobStore, providerSyncPipeline } from "../core-sync/index.js";
import type { UnifiedCatalogImportRequest, UnifiedCatalogImportSummary } from "./catalog-import.types.js";

export class CatalogImportService {
  start(input: UnifiedCatalogImportRequest): JobRecord<UnifiedCatalogImportSummary> {
    return jobManager.create(providerSyncPipeline, {
      type: "UNIFIED_CATALOG_IMPORT",
      provider: input.provider,
      input: {
        ...input,
        importCanonical: true,
        saveSnapshot: input.saveSnapshot !== false,
        buildKnowledge: input.buildKnowledge !== false,
        classifyProducts: input.classifyProducts !== false,
        importMedia: input.importMedia !== false,
      },
      metadata: {
        requestedAt: new Date().toISOString(),
        mode: "FULL_CATALOG_PIPELINE",
        request: {
          provider: input.provider,
          limit: input.limit,
          updatedSince: input.updatedSince,
          batchSize: input.batchSize,
          markMissingInactive: input.markMissingInactive,
          saveSnapshot: input.saveSnapshot,
          buildKnowledge: input.buildKnowledge,
          classifyProducts: input.classifyProducts,
          forceClassification: input.forceClassification,
          importMedia: input.importMedia,
          forceMedia: input.forceMedia,
          mediaConcurrency: input.mediaConcurrency,
          makitoOptions: input.makitoOptions,
        },
      },
    }) as JobRecord<UnifiedCatalogImportSummary>;
  }

  async get(jobId: string): Promise<JobRecord<UnifiedCatalogImportSummary> | undefined> {
    return jobManager.get<UnifiedCatalogImportSummary>(jobId)
      ?? await jobStore.get(jobId) as JobRecord<UnifiedCatalogImportSummary> | undefined;
  }

  async list(provider?: string): Promise<JobRecord[]> {
    const current = jobManager.list({ provider, limit: 100 });
    const stored = await jobStore.list(100);
    const merged = new Map<string, JobRecord>();
    for (const job of [...stored, ...current]) merged.set(job.id, job);
    return [...merged.values()]
      .filter(job => !provider || job.provider === provider)
      .filter(job => job.type === "UNIFIED_CATALOG_IMPORT" || job.type === "PROVIDER_SYNC")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 100);
  }
}

export const catalogImportService = new CatalogImportService();
