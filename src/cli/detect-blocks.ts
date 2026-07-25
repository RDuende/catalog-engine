import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { BlockDetectorService, type CatalogPageInput } from "../modules/block-detector/index.js";

function parsePages(value: unknown): CatalogPageInput[] {
  const candidate = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && Array.isArray((value as { pages?: unknown }).pages)
      ? (value as { pages: unknown[] }).pages
      : null;

  if (!candidate) throw new Error("El JSON debe ser un array de páginas o un objeto con la propiedad pages.");

  return candidate.map((item, index) => {
    if (typeof item !== "object" || item === null) throw new Error(`Página inválida en la posición ${index}.`);
    const page = item as { page?: unknown; text?: unknown };
    if (typeof page.text !== "string") throw new Error(`La página ${index + 1} no contiene texto válido.`);
    return { page: typeof page.page === "number" ? page.page : index + 1, text: page.text };
  });
}

async function main(): Promise<void> {
  const inputArg = process.argv[2];
  const outputArg = process.argv[3];
  if (!inputArg) {
    console.error("Uso: npm run catalog:blocks -- <catalogo.json> [salida.json]");
    process.exitCode = 1;
    return;
  }

  const inputPath = resolve(inputArg);
  const outputPath = resolve(outputArg ?? `reports/${basename(inputPath, ".json")}-blocks.json`);
  const raw = JSON.parse(await readFile(inputPath, "utf8")) as unknown;
  const pages = parsePages(raw);
  const result = new BlockDetectorService().detect(pages);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(result, null, 2), "utf8");

  console.log(`Páginas procesadas: ${result.pages}`);
  console.log(`Bloques detectados: ${result.statistics.total}`);
  console.log(`Confianza media: ${result.statistics.averageConfidence}`);
  console.log(`Informe: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
