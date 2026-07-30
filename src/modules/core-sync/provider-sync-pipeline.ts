import type { ProviderConnectionConfig } from "../provider-engine/provider-types.js";
import type { MakitoApiConfig } from "../provider-engine/makito-client.js";
import type { MakitoSyncOptions } from "../provider-engine/makito-sync.js";
import { syncMakitoSnapshot } from "../provider-engine/makito-sync.js";
import { syncProvider } from "../provider-engine/provider-service.js";
import { importCanonicalProducts } from "../canonical-catalog/canonical-service.js";
import type { PipelineDefinition, PipelineStage } from "./core-sync-types.js";

export interface ProviderSyncJobInput {
  provider: string;
  config: ProviderConnectionConfig | MakitoApiConfig;
  limit?: number;
  updatedSince?: string;
  makitoOptions?: MakitoSyncOptions;
  importCanonical?: boolean;
}

export interface ProviderSyncJobResult {
  provider: string;
  sync: Record<string, unknown>;
  canonical?: unknown;
  startedAt: string;
  finishedAt: string;
}

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
      return;
    }
    const sync = await syncProvider(provider, config as ProviderConnectionConfig, {
      limit: context.input.limit,
      updatedSince: context.input.updatedSince,
    });
    context.data.set("products", sync.products);
    context.data.set("sync", { ...sync, products: undefined });
  },
};

const canonicalStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "canonical-import",
  async execute(context) {
    if (context.input.importCanonical === false) return;
    const products = context.data.get("products");
    if (!Array.isArray(products)) throw new Error("El pipeline no produjo una colección de productos normalizados.");
    context.data.set("canonical", await importCanonicalProducts(context.input.provider, products));
  },
};

const reportStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "report",
  async execute(context) {
    const startedAt = (context.data.get("startedAt") as string | undefined) ?? new Date().toISOString();
    context.result = {
      provider: context.input.provider,
      sync: (context.data.get("sync") as Record<string, unknown> | undefined) ?? {},
      canonical: context.data.get("canonical"),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  },
};

const startStage: PipelineStage<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "initialize",
  async execute(context) {
    context.data.set("startedAt", new Date().toISOString());
  },
};

export const providerSyncPipeline: PipelineDefinition<ProviderSyncJobInput, ProviderSyncJobResult> = {
  name: "provider-sync",
  stages: [startStage, downloadStage, canonicalStage, reportStage],
};
