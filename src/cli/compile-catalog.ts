import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { BlockDetectorService } from "../modules/block-detector/block-detector.service.js";
import type { CatalogPageInput } from "../modules/block-detector/block-detector.types.js";
import { calculateCatalogMetrics } from "../core/metrics/catalog-metrics.js";
import { compileBlocks, compileSemanticBlocks } from "../core/compiler.js";

async function main(): Promise<void> {
  const inputArg = process.argv[2];
  if (!inputArg) throw new Error("Uso: npm run catalog:compile -- <catalogo.json>");
  const inputPath = resolve(inputArg);
  const parsed: unknown = JSON.parse(await readFile(inputPath, "utf8"));
  const pages = normalizePages(parsed);
  const detection = new BlockDetectorService().detect(pages);
  const result = await compileBlocks(basename(inputPath), detection.blocks);
  const semanticResult = await compileSemanticBlocks(basename(inputPath), detection.blocks);
  const metrics = calculateCatalogMetrics(result.output);
  const outputPath = join(dirname(inputPath), "reports", `${basename(inputPath, extname(inputPath))}-compiled.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify({ tree: result.output, semantic: semanticResult.output, metrics, pipeline: [...result.metrics, ...semanticResult.metrics] }, null, 2), "utf8");
  console.log(`Catalog compiled: ${outputPath}`);
  console.log(`Products: ${metrics.products} | Valid: ${semanticResult.output.statistics.validProducts} | Invalid: ${semanticResult.output.statistics.invalidProducts} | Categories: ${metrics.categories}`);
}

function normalizePages(value: unknown): CatalogPageInput[] {
  const candidate = Array.isArray(value) ? value : (value && typeof value === "object" && "pages" in value ? (value as { pages: unknown }).pages : undefined);
  if (!Array.isArray(candidate)) throw new Error("El JSON debe ser un array de páginas o contener una propiedad pages");
  return candidate.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Página inválida en posición ${index}`);
    const record = item as Record<string, unknown>;
    return { page: typeof record.page === "number" ? record.page : index + 1, text: typeof record.text === "string" ? record.text : "" };
  });
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
