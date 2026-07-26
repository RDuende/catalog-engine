import type { CatalogSyntaxTree } from "../ast/nodes.js";

export interface CatalogMetrics {
  nodes: number;
  products: number;
  categories: number;
  diagnostics: number;
  averageConfidence: number;
  fieldCoverage: Record<string, number>;
}

export function calculateCatalogMetrics(tree: CatalogSyntaxTree): CatalogMetrics {
  const products = tree.nodes.filter((node) => node.kind === "Product");
  const categories = tree.nodes.filter((node) => node.kind === "Category");
  const allFields = ["reference", "name", "description", "price", "dimension", "material", "technique"];
  const fieldCoverage = Object.fromEntries(allFields.map((field) => {
    const count = products.filter((node) => node.kind === "Product" && node.fields.some((item) => item.field === field)).length;
    return [field, products.length ? count / products.length : 0];
  }));
  const averageConfidence = tree.nodes.length
    ? tree.nodes.reduce((sum, node) => sum + node.confidence, 0) / tree.nodes.length
    : 0;
  return { nodes: tree.nodes.length, products: products.length, categories: categories.length, diagnostics: tree.diagnostics.length, averageConfidence, fieldCoverage };
}
