import { detectProductKnowledge } from "./knowledge-detector.js";
import type { KnowledgeBuildOptions, KnowledgeBuildResult, KnowledgeBuilderRepository } from "./knowledge-builder.types.js";
import { loadKnowledgeDictionary } from "./knowledge-dictionary.js";

export class KnowledgeGraphBuilderService {
  constructor(private readonly repository: KnowledgeBuilderRepository) {}

  async build(options: KnowledgeBuildOptions = {}): Promise<KnowledgeBuildResult> {
    const started = Date.now();
    const batchSize = Math.min(Math.max(options.batchSize ?? 100, 1), 500);
    const total = Math.min(await this.repository.countProducts(options), options.limit ?? Number.MAX_SAFE_INTEGER);
    const result: KnowledgeBuildResult = {
      received: total, processed: 0, failed: 0, entitiesCreated: 0, entitiesReused: 0, aliasesUpserted: 0,
      linksCreated: 0, linksUpdated: 0, linksUnchanged: 0, writesAvoided: 0, staleLinksRemoved: 0, detections: 0, durationMs: 0, productsPerSecond: 0, errors: [],
    };
    const dictionary = await loadKnowledgeDictionary();
    const runId = await this.repository.startBuild(options);
    result.runId = runId;
    const entityCache = new Map<string, string>();
    try {
      for (let offset = 0; offset < total; offset += batchSize) {
        const products = await this.repository.listProducts({ ...options, offset, limit: Math.min(batchSize, total - offset) });
        for (const product of products) {
          try {
            const detections = detectProductKnowledge(product, dictionary);
            result.detections += detections.length;
            const retained: string[] = [];
            for (const detection of detections) {
              const cacheKey = `${detection.type}:${detection.key}:${product.providerKey}`;
              const cachedId = entityCache.get(cacheKey);
              const entity = cachedId
                ? { id: cachedId, created: false, aliasUpserted: false }
                : await this.repository.upsertDetectedEntity(detection, product.providerKey);
              entityCache.set(cacheKey, entity.id);
              retained.push(entity.id);
              if (entity.created) result.entitiesCreated += 1; else result.entitiesReused += 1;
              if (entity.aliasUpserted) result.aliasesUpserted += 1;
              const link = await this.repository.upsertProductLink({ productId: product.id, entityId: entity.id, relationType: detection.relationType, confidence: detection.confidence, source: detection.source, metadata: { detector: "dictionary-rules-v2" } });
              if (link === "CREATED") result.linksCreated += 1; else if (link === "UPDATED") result.linksUpdated += 1; else { result.linksUnchanged += 1; result.writesAvoided += 1; }
            }
            if (options.removeStaleAutoLinks !== false) result.staleLinksRemoved += await this.repository.removeStaleAutoLinks(product.id, retained);
            result.processed += 1;
          } catch (error) {
            result.failed += 1;
            result.errors.push({ productId: product.id, message: error instanceof Error ? error.message : String(error) });
          }
          await options.onProgress?.(result.processed + result.failed, total);
        }
      }
      result.durationMs = Date.now() - started;
      result.productsPerSecond = result.durationMs ? Number((result.processed / (result.durationMs / 1000)).toFixed(2)) : result.processed;
      await this.repository.finishBuild(runId, result, "COMPLETED");
      return result;
    } catch (error) {
      result.durationMs = Date.now() - started;
      result.errors.push({ productId: "pipeline", message: error instanceof Error ? error.message : String(error) });
      await this.repository.finishBuild(runId, result, "FAILED");
      throw error;
    }
  }
}
