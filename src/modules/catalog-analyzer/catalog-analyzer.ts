import { basename } from "node:path";
import type {
  AnalyzedPage,
  CatalogAnalyzerReport,
  CatalogPage,
  PageKind,
} from "./catalog-analyzer.types.js";
import { analyzePage } from "./page-detector.js";

const VERSION = "0.30.1";

const PAGE_KINDS: PageKind[] = [
  "PRODUCT",
  "CATEGORY",
  "INDEX",
  "INTRO",
  "LEGAL",
  "BACK_COVER",
  "UNKNOWN",
];

function inferProvider(filePath: string, pages: CatalogPage[]): string {
  const haystack = `${basename(filePath)}\n${pages
    .slice(0, 25)
    .map((page) => page.text)
    .join("\n")}`.toLowerCase();

  if (haystack.includes("makito")) return "Makito";
  if (haystack.includes("pf concept") || haystack.includes("pfconcept")) {
    return "PF Concept";
  }
  if (haystack.includes("giving")) return "Giving";
  return "Desconocido";
}

function calculateGlobalConfidence(pages: AnalyzedPage[]): number {
  if (pages.length === 0) return 0;

  const average =
    pages.reduce((total, page) => total + page.confidence, 0) / pages.length;
  const unknownRatio =
    pages.filter((page) => page.kind === "UNKNOWN").length / pages.length;
  const warningRatio =
    pages.filter((page) => page.warnings.length > 0).length / pages.length;

  return Number(
    Math.max(0, Math.min(1, average - unknownRatio * 0.2 - warningRatio * 0.05)).toFixed(4),
  );
}

export function analyzeCatalog(input: {
  sourceFile: string;
  sourceHash: string;
  pages: CatalogPage[];
  startedAt: number;
}): CatalogAnalyzerReport {
  const analyzedPages = input.pages.map((page) =>
    analyzePage(page, input.pages.length),
  );

  const pagesByKind = Object.fromEntries(
    PAGE_KINDS.map((kind) => [
      kind,
      analyzedPages.filter((page) => page.kind === kind).length,
    ]),
  ) as Record<PageKind, number>;

  const references = analyzedPages.flatMap(
    (page) => page.signals.references,
  );
  const categories = [
    ...new Set(
      analyzedPages
        .filter((page) => page.kind === "CATEGORY")
        .flatMap((page) => page.signals.categoryCandidates),
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));

  const languages = [
    ...new Set(analyzedPages.flatMap((page) => page.signals.languages)),
  ].sort();

  const referencePages = new Map<string, number[]>();
  for (const page of analyzedPages) {
    for (const reference of page.signals.references) {
      const pages = referencePages.get(reference) ?? [];
      if (!pages.includes(page.page)) pages.push(page.page);
      referencePages.set(reference, pages);
    }
  }

  const diagnostics = {
    duplicateReferences: [...referencePages.entries()]
      .filter(([, pages]) => pages.length > 1)
      .map(([reference, pages]) => ({ reference, pages }))
      .sort((a, b) => a.reference.localeCompare(b.reference, "es")),
    productPagesWithoutReferences: analyzedPages
      .filter((page) => page.kind === "PRODUCT" && page.signals.references.length === 0)
      .map((page) => page.page),
    productPagesWithoutPrices: analyzedPages
      .filter((page) => page.kind === "PRODUCT" && page.signals.prices.length === 0)
      .map((page) => page.page),
    emptyPages: analyzedPages
      .filter((page) => page.textLength === 0)
      .map((page) => page.page),
    unknownPages: analyzedPages
      .filter((page) => page.kind === "UNKNOWN")
      .map((page) => page.page),
  };

  return {
    analyzerVersion: VERSION,
    sourceFile: input.sourceFile,
    sourceHash: input.sourceHash,
    provider: inferProvider(input.sourceFile, input.pages),
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - input.startedAt,
    confidence: calculateGlobalConfidence(analyzedPages),
    totals: {
      pages: analyzedPages.length,
      pagesByKind,
      productPages: pagesByKind.PRODUCT,
      categoryPages: pagesByKind.CATEGORY,
      references: references.length,
      uniqueReferences: new Set(references).size,
      prices: analyzedPages.reduce(
        (total, page) => total + page.signals.prices.length,
        0,
      ),
      printCodes: analyzedPages.reduce(
        (total, page) => total + page.signals.printCodes.length,
        0,
      ),
      dimensions: analyzedPages.reduce(
        (total, page) => total + page.signals.dimensions.length,
        0,
      ),
      packagingMentions: analyzedPages.reduce(
        (total, page) => total + page.signals.packaging.length,
        0,
      ),
      categories: categories.length,
      languages,
      warnings: analyzedPages.reduce(
        (total, page) => total + page.warnings.length,
        0,
      ),
    },
    categories,
    diagnostics,
    warnings: analyzedPages
      .filter((page) => page.warnings.length > 0)
      .map((page) => ({ page: page.page, messages: page.warnings })),
    pages: analyzedPages,
  };
}
