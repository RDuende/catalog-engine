import type { JobEngine } from "../../core/jobs/job-engine.js";
import type { KnowledgeBuilder } from "./knowledge-builder.service.js";
import type { KnowledgeBuildOptions } from "./knowledge-builder.types.js";

export const KNOWLEDGE_BUILD_PRODUCT_JOB = "knowledge.build-product";
export const KNOWLEDGE_BUILD_CATALOG_JOB = "knowledge.build-catalog";

export interface BuildProductJobPayload extends KnowledgeBuildOptions {
  readonly productId: string;
}

export interface BuildCatalogJobPayload extends KnowledgeBuildOptions {
  readonly batchSize?: number;
}

export function registerKnowledgeBuilderJobs(
  engine: JobEngine,
  builder: KnowledgeBuilder
): readonly (() => void)[] {
  const unregisterProduct = engine.register<BuildProductJobPayload, unknown>(
    KNOWLEDGE_BUILD_PRODUCT_JOB,
    async (payload, context) => {
      context.throwIfCancellationRequested();
      await context.reportProgress({ progress: 10, message: "Analizando producto" });
      const result = await builder.buildProduct(payload.productId, payload);
      await context.reportProgress({ progress: 100, message: "Conocimiento generado" });
      return result;
    }
  );

  const unregisterCatalog = engine.register<BuildCatalogJobPayload, unknown>(
    KNOWLEDGE_BUILD_CATALOG_JOB,
    async (payload, context) => {
      const result = await builder.buildCatalog(payload, async (processed, total) => {
        context.throwIfCancellationRequested();
        const progress = total === 0 ? 100 : Math.round((processed / total) * 100);
        await context.reportProgress({
          progress,
          message: `${processed}/${total} productos procesados`
        });
      });
      return result;
    }
  );

  return [unregisterProduct, unregisterCatalog];
}
