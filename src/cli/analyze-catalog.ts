import { access } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { analyzeCatalog } from "../modules/catalog-analyzer/catalog-analyzer.js";
import {
  readCatalogPages,
  sha256File,
} from "../modules/catalog-analyzer/catalog-reader.js";
import { writeReports } from "../modules/catalog-analyzer/report-writer.js";

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}

function printUsage(): void {
  console.log(`
Uso:
  npm run catalog:analyze -- <archivo.json> [--out reports/makito]

Formatos:
  JSON   [{ "page": 1, "text": "..." }]
  JSON   { "pages": [{ "page": 1, "text": "..." }] }
  JSONL  una página JSON por línea
`);
}

async function main(): Promise<void> {
  const sourceArgument = process.argv
    .slice(2)
    .find((argument) => !argument.startsWith("--"));

  if (!sourceArgument || process.argv.includes("--help")) {
    printUsage();
    process.exitCode = sourceArgument ? 0 : 1;
    return;
  }

  const sourceFile = resolve(sourceArgument);
  const outputDirectory =
    argumentValue("--out") ??
    resolve("reports", basename(sourceFile).replace(/\.[^.]+$/, ""));

  await access(sourceFile);

  const startedAt = Date.now();

  console.log("CATALOG ENGINE ANALYZER v0.6.0");
  console.log("✓ Leyendo catálogo…");
  const [pages, sourceHash] = await Promise.all([
    readCatalogPages(sourceFile),
    sha256File(sourceFile),
  ]);

  console.log(`✓ ${formatNumber(pages.length)} páginas cargadas`);
  console.log("✓ Analizando páginas…");
  const report = analyzeCatalog({
    sourceFile,
    sourceHash,
    pages,
    startedAt,
  });

  console.log("✓ Generando informes…");
  const outputs = await writeReports(report, outputDirectory);

  console.log("");
  console.log(`Proveedor............. ${report.provider}`);
  console.log(`Páginas............... ${formatNumber(report.totals.pages)}`);
  console.log(
    `Páginas de producto... ${formatNumber(report.totals.productPages)}`,
  );
  console.log(
    `Referencias únicas.... ${formatNumber(report.totals.uniqueReferences)}`,
  );
  console.log(`Precios............... ${formatNumber(report.totals.prices)}`);
  console.log(
    `Print Codes........... ${formatNumber(report.totals.printCodes)}`,
  );
  console.log(
    `Confianza............. ${(report.confidence * 100)
      .toFixed(1)
      .replace(".", ",")} %`,
  );
  console.log(
    `Tiempo................ ${(report.elapsedMs / 1000)
      .toFixed(2)
      .replace(".", ",")} s`,
  );
  console.log("");
  console.log(`✓ Informe HTML: ${outputs.reportHtml}`);
  console.log(`✓ Informe JSON: ${outputs.reportJson}`);
  console.log("✓ Finalizado");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ Analyzer: ${message}`);
  process.exitCode = 1;
});
