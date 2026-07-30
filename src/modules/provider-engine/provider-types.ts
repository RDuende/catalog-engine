import type { NormalizedProduct } from "../import-engine/import.types.js";

export type ProviderAuth =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "api-key"; header: string; value: string }
  | { type: "basic"; username: string; password: string };

export interface ProviderRequestOptions {
  endpoint?: string;
  query?: Record<string, string | number | boolean | undefined>;
  page?: number;
  pageSize?: number;
  updatedSince?: string;
}

export interface ProviderConnectionConfig {
  baseUrl: string;
  auth?: ProviderAuth;
  headers?: Record<string, string>;
  timeoutMs?: number;
  productsPath?: string;
  productPath?: string;
  responseItemsPath?: string;
  responseTotalPath?: string;
  pageParam?: string;
  pageSizeParam?: string;
  updatedSinceParam?: string;
  pageSize?: number;
  maxPages?: number;
  fieldMap?: Record<string, string>;
}

export interface ProviderPage<T = unknown> {
  items: T[];
  page: number;
  pageSize: number;
  total?: number;
  hasMore: boolean;
  raw?: unknown;
}

export interface ProviderSyncStats {
  provider: string;
  fetched: number;
  normalized: number;
  skipped: number;
  errors: Array<{ externalId?: string; message: string }>;
  products: NormalizedProduct[];
  startedAt: string;
  finishedAt: string;
}

export interface ProviderAdapter<TRaw = unknown> {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  testConnection(config: ProviderConnectionConfig): Promise<{ ok: boolean; message: string; latencyMs: number }>;
  fetchPage(config: ProviderConnectionConfig, options?: ProviderRequestOptions): Promise<ProviderPage<TRaw>>;
  fetchProduct?(config: ProviderConnectionConfig, externalId: string): Promise<TRaw | null>;
  normalize(record: TRaw, config: ProviderConnectionConfig): NormalizedProduct | null;
}
