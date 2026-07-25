import assert from "node:assert/strict";
import test from "node:test";
import type { DocumentBlockType } from "../../modules/block-detector/block-detector.types.js";
import { CatalogTokenTypes, tokenTypeFromBlockType } from "./tokens.js";

const expectations: Array<[DocumentBlockType, string]> = [
  ["HEADER", CatalogTokenTypes.HEADER],
  ["FOOTER", CatalogTokenTypes.FOOTER],
  ["CATEGORY", CatalogTokenTypes.CATEGORY],
  ["PRODUCT", CatalogTokenTypes.PRODUCT_BLOCK],
  ["TABLE", CatalogTokenTypes.TABLE],
  ["TEXT", CatalogTokenTypes.TEXT],
  ["UNKNOWN", CatalogTokenTypes.UNKNOWN],
];

test("lexer translates every document block type into a canonical token type", () => {
  for (const [blockType, expectedTokenType] of expectations) {
    assert.equal(tokenTypeFromBlockType(blockType), expectedTokenType);
  }
});
