import {
  copyFile,
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

import {
  defaultCatalogInterestEnrichment,
} from "./catalog-interest-enrichment.service.js";
import type {
  EnrichableCatalogProduct,
} from "./catalog-interest-enrichment.types.js";

function argument(
  name: string,
): string | undefined {
  const index =
    process.argv.indexOf(name);
  return index >= 0
    ? process.argv[index + 1]
    : undefined;
}

function has(name: string): boolean {
  return process.argv.includes(name);
}

async function main(): Promise<void> {
  const input = resolve(
    argument("--input") ??
      process.env
        .SMART_CATALOG_PRODUCTS_FILE ??
      ".data/smart-catalog-products.json",
  );

  const apply = has("--apply");

  const output = resolve(
    argument("--output") ??
      (
        apply
          ? input
          : `${input}.enriched.preview.json`
      ),
  );

  const reportPath = resolve(
    argument("--report") ??
      `${output}.report.json`,
  );

  const raw = JSON.parse(
    await readFile(input, "utf8"),
  ) as unknown;

  if (!Array.isArray(raw)) {
    throw new Error(
      "El catálogo de entrada debe ser un array JSON.",
    );
  }

  const products =
    raw as EnrichableCatalogProduct[];

  const result =
    defaultCatalogInterestEnrichment
      .enrichCatalog(products, {
        minimumConfidence:
          Number(
            argument("--minimum-confidence") ??
              "0.72",
          ),
        maxInterestsPerProduct:
          Number(
            argument("--max-interests") ??
              "8",
          ),
        preserveManual:
          !has("--replace-manual"),
      });

  if (apply && output === input) {
    const timestamp =
      new Date()
        .toISOString()
        .replaceAll(":", "-");

    await copyFile(
      input,
      `${input}.backup-${timestamp}`,
    );
  }

  await writeFile(
    output,
    JSON.stringify(
      result.products,
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    reportPath,
    JSON.stringify(
      result.report,
      null,
      2,
    ),
    "utf8",
  );

  console.log("");
  console.log(
    apply
      ? "Catálogo enriquecido."
      : "Preview de enriquecimiento generado.",
  );
  console.log(`Entrada: ${input}`);
  console.log(`Salida: ${output}`);
  console.log(`Informe: ${reportPath}`);
  console.log(
    `Cobertura: ${result.report.before.coveragePercent}% → ${result.report.after.coveragePercent}%`,
  );
  console.log(
    `Productos modificados: ${result.report.changedProducts}`,
  );
  console.log(
    `Asignaciones añadidas: ${result.report.addedAssignments}`,
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : String(error),
  );
  process.exitCode = 1;
});
