import { createHash, randomUUID } from 'node:crypto';
import type { DocumentPage, DocumentSnapshot, DocumentSourceType } from './document-types.js';

export interface LoadDocumentInput {
  supplier: string;
  sourceType: DocumentSourceType;
  fileName: string;
  bytes?: Uint8Array;
  pages: Array<{ pageNumber: number; text: string; width?: number; height?: number }>;
  metadata?: Record<string, unknown>;
}

export class DocumentLoader {
  constructor(private readonly engineVersion = '0.38.0') {}

  load(input: LoadDocumentInput): DocumentSnapshot {
    if (!input.pages.length) throw new Error('El documento debe contener al menos una página');
    const hash = createHash('sha256');
    if (input.bytes) hash.update(input.bytes);
    else hash.update(input.pages.map((page) => page.text).join('\n\f\n'));

    const pages: DocumentPage[] = input.pages.map((page) => ({
      ...page,
      blocks: [],
    }));

    return {
      id: randomUUID(),
      supplier: input.supplier,
      sourceType: input.sourceType,
      fileName: input.fileName,
      sha256: hash.digest('hex'),
      engineVersion: this.engineVersion,
      createdAt: new Date().toISOString(),
      status: 'uploaded',
      pages,
      metadata: structuredClone(input.metadata ?? {}),
    };
  }
}
