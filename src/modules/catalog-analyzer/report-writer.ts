import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CatalogAnalyzerReport } from "./catalog-analyzer.types.js";

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1).replace(".", ",")} %`;
}

function createHtml(report: CatalogAnalyzerReport): string {
  const pageRows = report.pages
    .map(
      (page) => `
        <tr>
          <td>${page.page}</td>
          <td><span class="badge">${page.kind}</span></td>
          <td>${formatPercent(page.confidence)}</td>
          <td>${page.signals.references.length}</td>
          <td>${page.signals.prices.length}</td>
          <td>${page.signals.printCodes.length}</td>
          <td>${escapeHtml(page.warnings.join(" · ") || "—")}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catalog Analyzer · ${escapeHtml(report.provider)}</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#17202a;background:#f4f6f8}
body{margin:0;padding:32px}.wrap{max-width:1280px;margin:auto}
h1{margin:0 0 4px}.muted{color:#65727e}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:24px 0}
.card{background:white;border-radius:14px;padding:18px;box-shadow:0 2px 12px #0000000d}
.value{font-size:28px;font-weight:750}.label{font-size:13px;color:#65727e;margin-top:4px}
table{width:100%;border-collapse:collapse;background:white;border-radius:14px;overflow:hidden}
th,td{text-align:left;padding:11px 12px;border-bottom:1px solid #e8edf1;font-size:13px}
th{background:#eef2f5;position:sticky;top:0}.badge{font-size:11px;font-weight:700}
.meta{word-break:break-all;font-size:13px}.section{margin-top:28px}
</style>
</head>
<body><div class="wrap">
<h1>Catalog Engine Analyzer v${escapeHtml(report.analyzerVersion)}</h1>
<div class="muted">${escapeHtml(report.provider)} · ${escapeHtml(report.sourceFile)}</div>
<div class="grid">
  <div class="card"><div class="value">${report.totals.pages}</div><div class="label">Páginas</div></div>
  <div class="card"><div class="value">${report.totals.productPages}</div><div class="label">Páginas de producto</div></div>
  <div class="card"><div class="value">${report.totals.uniqueReferences}</div><div class="label">Referencias únicas</div></div>
  <div class="card"><div class="value">${report.totals.prices}</div><div class="label">Precios detectados</div></div>
  <div class="card"><div class="value">${report.totals.printCodes}</div><div class="label">Códigos de marcaje</div></div>
  <div class="card"><div class="value">${formatPercent(report.confidence)}</div><div class="label">Confianza global</div></div>
  <div class="card"><div class="value">${report.diagnostics.duplicateReferences.length}</div><div class="label">Referencias duplicadas</div></div>
  <div class="card"><div class="value">${report.diagnostics.unknownPages.length}</div><div class="label">Páginas sin clasificar</div></div>
</div>
<div class="card meta">
  <strong>SHA-256:</strong> ${escapeHtml(report.sourceHash)}<br>
  <strong>Idiomas:</strong> ${escapeHtml(report.totals.languages.join(", ") || "No detectados")}<br>
  <strong>Tiempo:</strong> ${(report.elapsedMs / 1000).toFixed(2).replace(".", ",")} s<br>
  <strong>Advertencias:</strong> ${report.totals.warnings}
</div>
<div class="section">
<h2>Detalle por página</h2>
<table><thead><tr><th>Página</th><th>Tipo</th><th>Confianza</th><th>Refs.</th><th>Precios</th><th>Marcaje</th><th>Advertencias</th></tr></thead>
<tbody>${pageRows}</tbody></table>
</div>
</div></body></html>`;
}

export async function writeReports(
  report: CatalogAnalyzerReport,
  outputDirectory: string,
): Promise<{
  directory: string;
  reportJson: string;
  reportHtml: string;
  pagesJson: string;
  statisticsJson: string;
  diagnosticsJson: string;
}> {
  const directory = resolve(outputDirectory);
  await mkdir(directory, { recursive: true });

  const reportJson = join(directory, "report.json");
  const reportHtml = join(directory, "report.html");
  const pagesJson = join(directory, "pages.json");
  const statisticsJson = join(directory, "statistics.json");
  const diagnosticsJson = join(directory, "diagnostics.json");

  await Promise.all([
    writeFile(reportJson, JSON.stringify(report, null, 2), "utf8"),
    writeFile(reportHtml, createHtml(report), "utf8"),
    writeFile(pagesJson, JSON.stringify(report.pages, null, 2), "utf8"),
    writeFile(
      diagnosticsJson,
      JSON.stringify(report.diagnostics, null, 2),
      "utf8",
    ),
    writeFile(
      statisticsJson,
      JSON.stringify(
        {
          analyzerVersion: report.analyzerVersion,
          provider: report.provider,
          sourceFile: report.sourceFile,
          sourceHash: report.sourceHash,
          generatedAt: report.generatedAt,
          elapsedMs: report.elapsedMs,
          confidence: report.confidence,
          totals: report.totals,
          categories: report.categories,
        },
        null,
        2,
      ),
      "utf8",
    ),
  ]);

  return {
    directory,
    reportJson,
    reportHtml,
    pagesJson,
    statisticsJson,
    diagnosticsJson,
  };
}
