import { documentModelFromBlocks, type DocumentModel } from "./document/index.js";
import { DocumentLexer, type CatalogToken } from "./lexer/index.js";
import { CatalogParser } from "./parser/index.js";
import { Pipeline, type PipelineResult } from "./pipeline/index.js";
import type { CatalogSyntaxTree } from "./ast/index.js";
import { SemanticAnalyzer, type SemanticCatalog } from "./semantic/index.js";
import type { DocumentBlock } from "../modules/block-detector/block-detector.types.js";

export function compileBlocks(sourceFile: string, blocks: DocumentBlock[], provider?: string): Promise<PipelineResult<CatalogSyntaxTree>> {
  const document = documentModelFromBlocks(sourceFile, blocks, provider);
  const pipeline = new Pipeline<DocumentModel, CatalogSyntaxTree>()
    .use(new DocumentLexer())
    .use(new CatalogParser(sourceFile));
  return pipeline.run(document, { sourceFile, provider });
}

export type { CatalogToken };

export function compileSemanticBlocks(sourceFile: string, blocks: DocumentBlock[], provider?: string): Promise<PipelineResult<SemanticCatalog>> {
  const document = documentModelFromBlocks(sourceFile, blocks, provider);
  const pipeline = new Pipeline<DocumentModel, SemanticCatalog>()
    .use(new DocumentLexer())
    .use(new CatalogParser(sourceFile))
    .use(new SemanticAnalyzer());
  return pipeline.run(document, { sourceFile, provider });
}
