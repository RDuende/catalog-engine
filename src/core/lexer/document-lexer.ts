import type { DocumentModel } from "../document/document-model.js";
import type { PipelineStage, StageContext } from "../pipeline/pipeline.js";
import {
  tokenTypeFromBlockType,
  type CatalogToken,
} from "./tokens.js";

export class DocumentLexer implements PipelineStage<DocumentModel, CatalogToken[]> {
  readonly name = "document-lexer";

  execute(document: DocumentModel, _context: StageContext): CatalogToken[] {
    return document.pages.flatMap((page) =>
      page.elements.map((element) => ({
        id: element.id,
        type: tokenTypeFromBlockType(element.kind),
        lexeme: element.text,
        confidence: element.confidence,
        signals: [...element.signals],
        location: element.location,
      })),
    );
  }
}
