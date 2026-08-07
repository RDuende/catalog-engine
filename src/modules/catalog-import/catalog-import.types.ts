import type { ProviderConnectionConfig } from "../provider-engine/provider-types.js";
import type { MakitoApiConfig } from "../provider-engine/makito-client.js";
import type { MakitoSyncOptions } from "../provider-engine/makito-sync.js";

export interface UnifiedCatalogImportRequest {
  provider: string;
  config: ProviderConnectionConfig | MakitoApiConfig;
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
  makitoOptions?: MakitoSyncOptions;
}

export interface UnifiedCatalogImportSummary {
  provider: string;
  jobId: string;
  sync: Record<string, unknown>;
  canonical?: unknown;
  classification?: unknown;
  media?: unknown;
  knowledge?: unknown;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  metrics: {
    stages: unknown[];
    productsPerSecond?: number;
  };
}
