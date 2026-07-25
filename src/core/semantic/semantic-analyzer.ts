import type { CatalogSyntaxTree, FieldNode, ProductSyntaxNode } from "../ast/nodes.js";
import type { PipelineStage, StageContext } from "../pipeline/pipeline.js";
import type { MoneyValue, SemanticCatalog, SemanticDiagnostic, SemanticProduct } from "./model.js";

const REQUIRED_FIELDS = ["reference", "name"] as const;

export class SemanticAnalyzer implements PipelineStage<CatalogSyntaxTree, SemanticCatalog> {
  readonly name = "semantic-analyzer";

  execute(tree: CatalogSyntaxTree, _context: StageContext): SemanticCatalog {
    const diagnostics: SemanticDiagnostic[] = tree.diagnostics.map((diagnostic) => ({ ...diagnostic }));
    const products: SemanticProduct[] = [];
    const categories: string[] = [];
    let currentCategory: string | undefined;
    let ignoredTextNodes = 0;

    for (const node of tree.nodes) {
      if (node.kind === "Category") {
        currentCategory = normalizeWhitespace(node.name);
        if (currentCategory && !categories.includes(currentCategory)) categories.push(currentCategory);
        continue;
      }
      if (node.kind === "Text") {
        ignoredTextNodes += 1;
        continue;
      }
      products.push(this.analyzeProduct(node, currentCategory, diagnostics));
    }

    const validProducts = products.filter((product) => product.valid).length;
    const averageConfidence = products.length
      ? products.reduce((sum, product) => sum + product.confidence, 0) / products.length
      : 0;

    return {
      kind: "SemanticCatalog",
      sourceFile: tree.sourceFile,
      products,
      categories,
      diagnostics,
      statistics: {
        validProducts,
        invalidProducts: products.length - validProducts,
        ignoredTextNodes,
        averageConfidence,
      },
    };
  }

  private analyzeProduct(
    node: ProductSyntaxNode,
    category: string | undefined,
    diagnostics: SemanticDiagnostic[],
  ): SemanticProduct {
    const reference = firstValue(node.fields, "reference", normalizeReference);
    const name = firstValue(node.fields, "name", normalizeWhitespace);
    const description = firstValue(node.fields, "description", normalizeWhitespace);
    const prices = values(node.fields, "price").flatMap((value) => {
      const parsed = parseEuroPrice(value);
      if (!parsed) {
        diagnostics.push({ severity: "warning", code: "INVALID_PRICE", message: `Precio no reconocido: ${value}`, productId: node.id, location: node.location });
        return [];
      }
      return [parsed];
    });
    const dimensions = unique(values(node.fields, "dimension").map(normalizeWhitespace));
    const materials = unique(values(node.fields, "material").map(normalizeLabel));
    const techniques = unique(values(node.fields, "technique").map(normalizeLabel));
    const missing = REQUIRED_FIELDS.filter((field) => field === "reference" ? !reference : !name);
    const warnings: string[] = [];

    if (!prices.length) warnings.push("price_missing");
    if (!description) warnings.push("description_missing");
    if (!materials.length) warnings.push("material_missing");
    if (!techniques.length) warnings.push("technique_missing");

    for (const field of missing) {
      diagnostics.push({ severity: "error", code: `SEMANTIC_${field.toUpperCase()}_MISSING`, message: `El producto no tiene ${field}`, productId: node.id, location: node.location });
    }
    for (const warning of warnings) {
      diagnostics.push({ severity: "warning", code: `SEMANTIC_${warning.toUpperCase()}`, message: warning.replaceAll("_", " "), productId: node.id, location: node.location });
    }

    return {
      id: node.id,
      reference,
      name,
      description,
      prices,
      dimensions,
      materials,
      techniques,
      category,
      valid: missing.length === 0,
      confidence: calculateProductConfidence(node, missing.length, warnings.length),
      missing,
      warnings,
      source: { rawText: node.rawText, location: node.location },
    };
  }
}

function values(fields: FieldNode[], field: FieldNode["field"]): string[] {
  return fields.filter((item) => item.field === field).map((item) => item.value);
}

function firstValue(fields: FieldNode[], field: FieldNode["field"], normalize: (value: string) => string): string | undefined {
  const value = values(fields, field)[0];
  if (!value) return undefined;
  const normalized = normalize(value);
  return normalized || undefined;
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeReference(value: string): string {
  return normalizeWhitespace(value).toUpperCase().replace(/^REF\.?\s*/i, "");
}

function normalizeLabel(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase("es-ES");
}

function parseEuroPrice(value: string): MoneyValue | undefined {
  const normalized = value.replace(/\s/g, "").replace("€", "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  const amountMinor = Math.round(amount * 100);
  return {
    amountMinor,
    currency: "EUR",
    formatted: new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amountMinor / 100),
  };
}

function unique(valuesToDeduplicate: string[]): string[] {
  return [...new Set(valuesToDeduplicate.filter(Boolean))];
}

function calculateProductConfidence(node: ProductSyntaxNode, missingCount: number, warningCount: number): number {
  const fieldConfidence = node.fields.length
    ? node.fields.reduce((sum, field) => sum + field.confidence, 0) / node.fields.length
    : node.confidence;
  const base = (node.confidence + fieldConfidence) / 2;
  return Math.max(0, Math.min(1, base - missingCount * 0.2 - warningCount * 0.025));
}
