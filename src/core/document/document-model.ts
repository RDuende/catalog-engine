import type { DocumentBlock } from "../../modules/block-detector/block-detector.types.js";

export interface SourceLocation {
  page: number;
  startLine: number;
  endLine: number;
}

export interface DocumentElement {
  id: string;
  kind: DocumentBlock["type"];
  text: string;
  confidence: number;
  signals: string[];
  location: SourceLocation;
}

export interface DocumentPageModel {
  page: number;
  elements: DocumentElement[];
}

export interface DocumentMetadata {
  sourceFile: string;
  provider?: string;
  createdAt: string;
}

export interface DocumentModel {
  metadata: DocumentMetadata;
  pages: DocumentPageModel[];
  statistics: {
    pages: number;
    elements: number;
    averageConfidence: number;
  };
}

export function documentModelFromBlocks(
  sourceFile: string,
  blocks: DocumentBlock[],
  provider?: string,
): DocumentModel {
  const byPage = new Map<number, DocumentElement[]>();
  for (const block of blocks) {
    const elements = byPage.get(block.page) ?? [];
    elements.push({
      id: block.id,
      kind: block.type,
      text: block.text,
      confidence: block.confidence,
      signals: [...block.signals],
      location: { page: block.page, startLine: block.startLine, endLine: block.endLine },
    });
    byPage.set(block.page, elements);
  }

  const pages = [...byPage.entries()]
    .sort(([a], [b]) => a - b)
    .map(([page, elements]) => ({ page, elements }));
  const averageConfidence = blocks.length
    ? blocks.reduce((sum, block) => sum + block.confidence, 0) / blocks.length
    : 0;

  return {
    metadata: { sourceFile, provider, createdAt: new Date().toISOString() },
    pages,
    statistics: { pages: pages.length, elements: blocks.length, averageConfidence },
  };
}
