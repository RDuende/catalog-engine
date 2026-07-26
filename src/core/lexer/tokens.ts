import type { SourceLocation } from "../document/document-model.js";
import type { DocumentBlockType } from "../../modules/block-detector/block-detector.types.js";

/**
 * Canonical token names consumed by the Core parser.
 *
 * Keep these values independent from detector-specific block names. The lexer
 * is the translation boundary between the Document Model and the parser.
 */
export const CatalogTokenTypes = {
  HEADER: "HEADER",
  FOOTER: "FOOTER",
  CATEGORY: "CATEGORY",
  PRODUCT_BLOCK: "PRODUCT_BLOCK",
  TABLE: "TABLE",
  TEXT: "TEXT",
  UNKNOWN: "UNKNOWN",
} as const;

export type CatalogTokenType =
  (typeof CatalogTokenTypes)[keyof typeof CatalogTokenTypes];

/**
 * Exhaustive translation from Block Detector vocabulary to Core token
 * vocabulary. `satisfies Record<...>` makes TypeScript fail when a new block
 * type is added without defining its lexical representation.
 */
export const BLOCK_TYPE_TO_TOKEN_TYPE = {
  HEADER: CatalogTokenTypes.HEADER,
  FOOTER: CatalogTokenTypes.FOOTER,
  CATEGORY: CatalogTokenTypes.CATEGORY,
  PRODUCT: CatalogTokenTypes.PRODUCT_BLOCK,
  TABLE: CatalogTokenTypes.TABLE,
  TEXT: CatalogTokenTypes.TEXT,
  UNKNOWN: CatalogTokenTypes.UNKNOWN,
} as const satisfies Record<DocumentBlockType, CatalogTokenType>;

export function tokenTypeFromBlockType(
  blockType: DocumentBlockType,
): CatalogTokenType {
  return BLOCK_TYPE_TO_TOKEN_TYPE[blockType];
}

export interface CatalogToken {
  id: string;
  type: CatalogTokenType;
  lexeme: string;
  confidence: number;
  signals: string[];
  location: SourceLocation;
}
