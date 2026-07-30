import type { CatalogSyntaxNode, CategorySyntaxNode, ProductSyntaxNode, TextSyntaxNode } from "./nodes.js";

export interface AstVisitor<T = void> {
  visitProduct(node: ProductSyntaxNode): T;
  visitCategory(node: CategorySyntaxNode): T;
  visitText(node: TextSyntaxNode): T;
}

export function visitNode<T>(node: CatalogSyntaxNode, visitor: AstVisitor<T>): T {
  switch (node.kind) {
    case "Product": return visitor.visitProduct(node);
    case "Category": return visitor.visitCategory(node);
    case "Text": return visitor.visitText(node);
  }
}
