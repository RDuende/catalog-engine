import type { PipelineStage, StageContext } from "../pipeline/pipeline.js";
import type { SemanticCatalog, SemanticProduct } from "../semantic/model.js";
import type {
  CanonicalCatalog,
  CanonicalDiagnostic,
  CanonicalProduct,
  CanonicalTaxonomyTerm,
} from "./model.js";

export class CanonicalProductBuilder implements PipelineStage<SemanticCatalog, CanonicalCatalog> {
  readonly name = "canonical-product-builder";

  execute(catalog: SemanticCatalog, context: StageContext): CanonicalCatalog {
    const provider = normalizeOptionalString(context.metadata.provider);
    const diagnostics: CanonicalDiagnostic[] = catalog.diagnostics.map((diagnostic) => ({ ...diagnostic }));
    const products = catalog.products.map((product) => this.buildProduct(product, catalog.sourceFile, provider, diagnostics));
    const validProducts = products.filter((product) => product.valid).length;
    const averageConfidence = products.length
      ? products.reduce((sum, product) => sum + product.confidence, 0) / products.length
      : 0;

    return {
      kind: "CanonicalCatalog",
      schemaVersion: "1.0",
      sourceFile: catalog.sourceFile,
      provider,
      products,
      diagnostics,
      statistics: {
        totalProducts: products.length,
        validProducts,
        invalidProducts: products.length - validProducts,
        averageConfidence,
      },
    };
  }

  private buildProduct(
    product: SemanticProduct,
    sourceFile: string,
    provider: string | undefined,
    diagnostics: CanonicalDiagnostic[],
  ): CanonicalProduct {
    const supplierSku = normalizeSku(product.reference ?? "");
    const name = normalizeWhitespace(product.name ?? "");
    const warnings = [...product.warnings];

    if (!supplierSku) addCanonicalError(diagnostics, product, "CANONICAL_SKU_MISSING", "El producto no tiene SKU canónico");
    if (!name) addCanonicalError(diagnostics, product, "CANONICAL_NAME_MISSING", "El producto no tiene nombre canónico");

    const valid = product.valid && Boolean(supplierSku) && Boolean(name);
    const id = buildCanonicalId(provider, supplierSku || product.id);

    return {
      id,
      sku: id,
      supplier: provider,
      supplierSku,
      name,
      description: normalizeOptionalString(product.description),
      categories: product.category ? [taxonomy(product.category)] : [],
      materials: uniqueTerms(product.materials),
      techniques: uniqueTerms(product.techniques),
      dimensions: unique(product.dimensions.map(normalizeWhitespace)),
      prices: product.prices.map((price) => ({ ...price })),
      tags: unique([
        ...(product.category ? [normalizeTerm(product.category)] : []),
        ...product.materials.map(normalizeTerm),
        ...product.techniques.map(normalizeTerm),
      ]),
      valid,
      confidence: product.confidence,
      warnings,
      source: {
        sourceFile,
        provider,
        semanticProductId: product.id,
        rawText: product.source.rawText,
        location: product.source.location,
      },
    };
  }
}

function addCanonicalError(
  diagnostics: CanonicalDiagnostic[],
  product: SemanticProduct,
  code: string,
  message: string,
): void {
  diagnostics.push({ severity: "error", code, message, productId: product.id, location: product.source.location });
}

function buildCanonicalId(provider: string | undefined, value: string): string {
  const providerPart = normalizeIdentifier(provider ?? "catalog");
  const productPart = normalizeIdentifier(value) || "unknown";
  return `${providerPart}:${productPart}`;
}

function normalizeSku(value: string): string {
  return normalizeWhitespace(value).toUpperCase();
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeWhitespace(value);
  return normalized || undefined;
}

function normalizeIdentifier(value: string): string {
  return normalizeTerm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeTerm(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function taxonomy(value: string): CanonicalTaxonomyTerm {
  return { label: normalizeWhitespace(value), normalized: normalizeTerm(value) };
}

function uniqueTerms(values: string[]): CanonicalTaxonomyTerm[] {
  const terms = new Map<string, CanonicalTaxonomyTerm>();
  for (const value of values) {
    const term = taxonomy(value);
    if (term.normalized && !terms.has(term.normalized)) terms.set(term.normalized, term);
  }
  return [...terms.values()];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
