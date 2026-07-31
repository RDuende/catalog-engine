import type { ProviderConnectionConfig } from "../provider-engine/provider-types.js";
import type { MakitoApiConfig } from "../provider-engine/makito-client.js";
import type { MakitoSyncOptions } from "../provider-engine/makito-sync.js";
import { syncMakitoSnapshot } from "../provider-engine/makito-sync.js";
import { syncProvider } from "../provider-engine/provider-service.js";
import { importCanonicalProducts } from "../canonical-catalog/canonical-service.js";
import type { PipelineDefinition, PipelineStage } from "./core-sync-types.js";
import { snapshotService, type SnapshotManifest } from "./snapshot-service.js";

export interface ProviderSyncJobInput {
  provider: string;
  config: ProviderConnectionConfig | MakitoApiConfig;
  limit?: number;
  updatedSince?: string;
  makitoOptions?: MakitoSyncOptions;
  importCanonical?: boolean;
  saveSnapshot?: boolean;
  markMissingInactive?: boolean;
  batchSize?: number;
}

export interface ProviderSyncJobResult {
  provider: string;
  jobId: string;
  sync: Record<string, unknown>;
  canonical?: unknown;
  snapshot?: { directory: string; manifest: SnapshotManifest };
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  metrics: { stages: unknown[]; productsPerSecond?: number };
}

const startStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "initialize",
  async execute(context) {
    context.data.set("startedAt", new Date().toISOString());
    if (context.input.saveSnapshot !== false) {
      context.data.set("manifest", await snapshotService.create(context.input.provider, context.jobId));
    }
  },
};

const downloadStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "download-and-normalize",
  async execute(context) {
    const { provider, config } = context.input;
    if (provider === "makito") {
      const snapshot = await syncMakitoSnapshot(config as MakitoApiConfig, {
        ...context.input.makitoOptions,
        limit: context.input.limit ?? context.input.makitoOptions?.limit,
      });
      context.data.set("products", snapshot.products);
      context.data.set("sync", {
        generatedAt: snapshot.generatedAt,
        sourceGeneratedAt: snapshot.sourceGeneratedAt,
        stats: snapshot.stats,
      });
    } else {
      const sync = await syncProvider(provider, config as ProviderConnectionConfig, {
        limit: context.input.limit,
        updatedSince: context.input.updatedSince,
      });
      context.data.set("products", sync.products);
      context.data.set("sync", { ...sync, products: undefined });
    }
  },
};

const snapshotStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "save-snapshot",
  async execute(context) {
    const manifest = context.data.get("manifest") as SnapshotManifest | undefined;
    if (!manifest) return;
    await snapshotService.write(context.input.provider, context.jobId, "normalized-products", context.data.get("products"), manifest);
    await snapshotService.write(context.input.provider, context.jobId, "sync-metadata", context.data.get("sync"), manifest);
  },
};

const canonicalStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "canonical-import",
  async execute(context) {
    if (context.input.importCanonical === false) return;
    const products = context.data.get("products");
    if (!Array.isArray(products)) throw new Error("El pipeline no produjo una colección de productos normalizados.");
    const fullSync = !context.input.limit && !context.input.updatedSince;
    context.data.set("canonical", await importCanonicalProducts(context.input.provider, products, undefined, {
      batchSize: context.input.batchSize,
      markMissingInactive: fullSync && context.input.markMissingInactive === true,
      onProgress: (completed, total) => context.reportProgress({
        step: "canonical-import",
        completed,
        total,
        message: `Importados ${completed} de ${total} productos`,
      }),
    }));
  },
};

const reportStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "report",
  async execute(context) {
    const startedAt = (context.data.get("startedAt") as string | undefined) ?? new Date().toISOString();
    const finishedAt = new Date().toISOString();
    const result: ProviderSyncJobResult = {
      provider: context.input.provider,
      jobId: context.jobId,
      sync: (context.data.get("sync") as Record<string, unknown> | undefined) ?? {},
      canonical: context.data.get("canonical"),
      startedAt,
      finishedAt,
      durationMs: Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt)),
      metrics: { stages: (context.data.get("stageMetrics") as unknown[] | undefined) ?? [] },
    };
    const productCount = Array.isArray(context.data.get("products")) ? (context.data.get("products") as unknown[]).length : 0;
    if (result.durationMs > 0) result.metrics.productsPerSecond = Number((productCount / (result.durationMs / 1000)).toFixed(2));
    const manifest = context.data.get("manifest") as SnapshotManifest | undefined;
    if (manifest) {
      await snapshotService.complete(context.input.provider, context.jobId, manifest, {
        sync: result.sync,
        canonical: result.canonical,
      });
      result.snapshot = {
        directory: snapshotService.directory(context.input.provider, context.jobId),
        manifest,
      };
    }
    await snapshotService.writeReport(context.input.provider, context.jobId, result);
    context.data.set("cleanup", await snapshotService.cleanup(context.input.provider));
    context.result = result;
  },
};

export const providerSyncPipeline: PipelineDefinition<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "provider-sync",
  stages: [startStage, downloadStage, snapshotStage, canonicalStage, reportStage],
  async onError(context, error) {
    const manifest = context.data.get("manifest") as SnapshotManifest | undefined;
    if (manifest) await snapshotService.fail(context.input.provider, context.jobId, manifest, error);
    await snapshotService.writeReport(context.input.provider, context.jobId, {
      provider: context.input.provider,
      jobId: context.jobId,
      status: "FAILED",
      failedStage: context.data.get("failedStage"),
      metrics: { stages: context.data.get("stageMetrics") ?? [] },
      error: error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) },
      finishedAt: new Date().toISOString(),
    });
  },
  async onCancel(context) {
    const manifest = context.data.get("manifest") as SnapshotManifest | undefined;
    if (manifest) await snapshotService.fail(context.input.provider, context.jobId, manifest, "Trabajo cancelado");
  },
};
