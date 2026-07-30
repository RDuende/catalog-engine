import type { ProviderConnectionConfig, ProviderSyncStats } from "./provider-types.js";
import { getProvider } from "./provider-registry.js";

export async function previewProvider(providerKey: string, config: ProviderConnectionConfig, limit = 10) {
  const provider = getProvider(providerKey);
  const page = await provider.fetchPage(config, { page: 1, pageSize: Math.max(1, Math.min(limit, 100)) });
  return page.items.map(record => ({ raw: record, normalized: provider.normalize(record, config) }));
}

export async function syncProvider(providerKey: string, config: ProviderConnectionConfig, options?: { limit?: number; updatedSince?: string }): Promise<ProviderSyncStats> {
  const provider = getProvider(providerKey);
  const startedAt = new Date().toISOString();
  const products: import("../import-engine/import.types.js").NormalizedProduct[] = [];
  const errors: Array<{ externalId?: string; message: string }> = [];
  let fetched = 0, skipped = 0, pageNumber = 1;
  const pageSize = config.pageSize ?? 100;
  const maxPages = config.maxPages ?? 1000;
  while (pageNumber <= maxPages) {
    const page = await provider.fetchPage(config, { page: pageNumber, pageSize, updatedSince: options?.updatedSince });
    for (const record of page.items) {
      if (options?.limit && fetched >= options.limit) break;
      fetched += 1;
      try {
        const normalized = provider.normalize(record, config);
        if (normalized) products.push(normalized); else skipped += 1;
      } catch (error) {
        errors.push({ message: error instanceof Error ? error.message : String(error) });
      }
    }
    if ((options?.limit && fetched >= options.limit) || !page.hasMore || page.items.length === 0) break;
    pageNumber += 1;
  }
  return { provider: providerKey, fetched, normalized: products.length, skipped, errors, products, startedAt, finishedAt: new Date().toISOString() };
}
