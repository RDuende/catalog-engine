import { toCanonicalProduct } from "./canonical-normalizer.js";
import { CanonicalCatalogRepository } from "./canonical-repository.js";
import type { CanonicalProductInput } from "./canonical-types.js";

export interface CanonicalImportOptions {
  batchSize?: number;
  markMissingInactive?: boolean;
  onProgress?: (completed: number, total: number) => void;
}

export async function importCanonicalProducts(
  providerKey: string,
  products: unknown[],
  repository = new CanonicalCatalogRepository(),
  options: CanonicalImportOptions = {},
) {
  const normalized: CanonicalProductInput[] = [];
  const normalizationErrors: Array<{ externalId?: string; message: string }> = [];
  for (const product of products) {
    try { normalized.push(toCanonicalProduct(providerKey, product)); }
    catch (error) { normalizationErrors.push({ message: error instanceof Error ? error.message : String(error) }); }
  }
  const result = await repository.import(normalized, { batchSize: options.batchSize, onProgress: options.onProgress });
  result.failed += normalizationErrors.length;
  result.errors.unshift(...normalizationErrors);
  const deactivated = options.markMissingInactive
    ? await repository.markMissingInactive(providerKey, normalized.map(product => product.externalId))
    : 0;
  return { ...result, deactivated };
}
