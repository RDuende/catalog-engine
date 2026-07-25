import type { SourceLocation } from "../document/document-model.js";

export interface AstNodeBase {
  id: string;
  kind: string;
  confidence: number;
  location: SourceLocation;
}

export interface FieldNode extends AstNodeBase {
  kind: "Field";
  field: "reference" | "name" | "description" | "price" | "dimension" | "material" | "technique";
  value: string;
}

export interface ProductSyntaxNode extends AstNodeBase {
  kind: "Product";
  rawText: string;
  fields: FieldNode[];
}

export interface CategorySyntaxNode extends AstNodeBase {
  kind: "Category";
  name: string;
}

export interface TextSyntaxNode extends AstNodeBase {
  kind: "Text";
  text: string;
}

export type CatalogSyntaxNode = ProductSyntaxNode | CategorySyntaxNode | TextSyntaxNode;

export interface CatalogSyntaxTree {
  kind: "Catalog";
  sourceFile: string;
  nodes: CatalogSyntaxNode[];
  diagnostics: ParserDiagnostic[];
}

export interface ParserDiagnostic {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  location?: SourceLocation;
}
