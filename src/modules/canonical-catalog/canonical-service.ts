import { toCanonicalProduct } from "./canonical-normalizer.js";
import { CanonicalCatalogRepository } from "./canonical-repository.js";
import type { CanonicalProductInput } from "./canonical-types.js";

export async function importCanonicalProducts(providerKey: string, products: unknown[], repository = new CanonicalCatalogRepository()) {
  const normalized: CanonicalProductInput[] = [];
  const normalizationErrors: Array<{ externalId?: string; message: string }> = [];
  for (const product of products) {
    try { normalized.push(toCanonicalProduct(providerKey, product)); }
    catch (error) { normalizationErrors.push({ message: error instanceof Error ? error.message : String(error) }); }
  }
  const result = await repository.import(normalized);
  result.failed += normalizationErrors.length;
  result.errors.unshift(...normalizationErrors);
  return result;
}
