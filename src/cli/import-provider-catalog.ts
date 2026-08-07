import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PipelineEngine, providerSyncPipeline, type PipelineContext } from "../modules/core-sync/index.js";
import { resolveMakitoConfig } from "../modules/provider-engine/makito-client.js";
import type { ProviderSyncJobInput, ProviderSyncJobResult } from "../modules/core-sync/provider-sync-pipeline.js";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find(item => item.startsWith(prefix))?.slice(prefix.length);
}

const provider = arg("source") ?? "makito";
if (provider !== "makito") throw new Error("El CLI integrado usa configuración automática solo para Makito. Para otros proveedores utiliza POST /api/v1/catalog-imports/:provider.");

const input: ProviderSyncJobInput = {
  provider,
  config: resolveMakitoConfig(),
  limit: Number(arg("limit") ?? 100000),
  batchSize: Number(arg("batch-size") ?? 250),
  importCanonical: true,
  saveSnapshot: !process.argv.includes("--no-snapshot"),
  markMissingInactive: process.argv.includes("--mark-missing-inactive"),
  buildKnowledge: !process.argv.includes("--no-knowledge"),
  classifyProducts: !process.argv.includes("--no-classification"),
  forceClassification: process.argv.includes("--force-classification"),
  importMedia: !process.argv.includes("--no-media"),
  forceMedia: process.argv.includes("--force-media"),
  mediaConcurrency: Number(arg("media-concurrency") ?? 4),
};

const controller = new AbortController();
process.once("SIGINT", () => controller.abort());
const jobId = randomUUID();
const context: PipelineContext<ProviderSyncJobInput, ProviderSyncJobResult> = {
  jobId,
  input,
  data: new Map(),
  signal: controller.signal,
  reportProgress(progress) {
    const percent = progress.percent ?? (progress.total > 0 ? Math.round(progress.completed * 100 / progress.total) : 0);
    process.stderr.write(`\r[${percent.toString().padStart(3)}%] ${progress.step}: ${progress.message ?? `${progress.completed}/${progress.total}`}`);
  },
};

const result = await new PipelineEngine().execute(providerSyncPipeline, context);
process.stderr.write("\n");
console.log(JSON.stringify(result, null, 2));
