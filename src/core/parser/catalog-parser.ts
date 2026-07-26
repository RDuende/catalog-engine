import type { CatalogSyntaxTree, FieldNode, ParserDiagnostic, ProductSyntaxNode } from "../ast/nodes.js";
import { CatalogTokenTypes, type CatalogToken } from "../lexer/tokens.js";
import type { PipelineStage, StageContext } from "../pipeline/pipeline.js";

const REFERENCE = /\b(?:ref\.?\s*)?([A-Z0-9][A-Z0-9.-]{3,})\b/i;
const PRICE = /\b\d{1,4}(?:[.,]\d{2})\s*€/g;
const DIMENSION = /\b\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:mm|cm|m|ml|l)\b/gi;
const MATERIAL = /\b(acero inoxidable|inox|stainless steel|algod[oó]n|poli[eé]ster|aluminio|bamb[uú]|madera|pl[aá]stico)\b/gi;
const TECHNIQUE = /\b(l[aá]ser|tampograf[ií]a|serigraf[ií]a|sublimaci[oó]n|transfer|bordado|impresi[oó]n uv)\b/gi;

export class CatalogParser implements PipelineStage<CatalogToken[], CatalogSyntaxTree> {
  readonly name = "catalog-parser";
  constructor(private readonly sourceFile: string) {}

  execute(tokens: CatalogToken[], _context: StageContext): CatalogSyntaxTree {
    const diagnostics: ParserDiagnostic[] = [];
    const nodes = tokens.map((token) => {
      if (token.type === CatalogTokenTypes.PRODUCT_BLOCK) return this.parseProduct(token, diagnostics);
      if (token.type === CatalogTokenTypes.CATEGORY) {
        return { id: token.id, kind: "Category" as const, name: token.lexeme.trim(), confidence: token.confidence, location: token.location };
      }
      return { id: token.id, kind: "Text" as const, text: token.lexeme, confidence: token.confidence, location: token.location };
    });
    return { kind: "Catalog", sourceFile: this.sourceFile, nodes, diagnostics };
  }

  private parseProduct(token: CatalogToken, diagnostics: ParserDiagnostic[]): ProductSyntaxNode {
    const lines = token.lexeme.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const fields: FieldNode[] = [];
    const add = (field: FieldNode["field"], value: string, confidence: number): void => {
      fields.push({ id: `${token.id}:${field}:${fields.length}`, kind: "Field", field, value, confidence, location: token.location });
    };
    const reference = token.lexeme.match(REFERENCE)?.[1];
    if (reference) add("reference", reference, 0.82);
    else diagnostics.push({ severity: "warning", code: "PRODUCT_REFERENCE_MISSING", message: "Product block has no reliable reference", location: token.location });

    const name = lines.find((line) => line.length >= 3 && !/\d{1,4}(?:[.,]\d{2})\s*€/.test(line) && !/\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:mm|cm|m|ml|l)/i.test(line));
    if (name) add("name", name, 0.7);
    if (lines.length > 1) add("description", lines.slice(1).join(" "), 0.55);

    for (const value of token.lexeme.match(PRICE) ?? []) add("price", value, 0.92);
    for (const value of token.lexeme.match(DIMENSION) ?? []) add("dimension", value, 0.86);
    for (const value of token.lexeme.match(MATERIAL) ?? []) add("material", value, 0.8);
    for (const value of token.lexeme.match(TECHNIQUE) ?? []) add("technique", value, 0.8);

    return { id: token.id, kind: "Product", rawText: token.lexeme, fields, confidence: token.confidence, location: token.location };
  }
}
