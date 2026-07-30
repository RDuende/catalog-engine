import { randomUUID } from 'node:crypto';
import type { DocumentBlock, DocumentPage } from './document-types.js';

const PRICE_HEADER = /(?:-500|\+500|\+2000|\+5000)/i;
const PRINT_CODE = /Print\s*Code\s*:/i;
const DIMENSIONS = /\b\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*[×x]\s*\d+(?:[.,]\d+)?\s*cm\b/i;
const ICON_TOKENS = /(TROLLEY\s+STRAP|LAPTOP\s+COMPARTMENT|TABLET\s+COMPARTMENT|ANTI\s+THEFT|RPET|DTF|REFLECTIVE|USB|VACUUM)/i;

export class LayoutAnalyzer {
  analyze(page: DocumentPage): DocumentPage {
    const lines = page.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const blocks: DocumentBlock[] = [];

    lines.forEach((line, index) => {
      let kind: DocumentBlock['kind'] = 'text';
      if (PRICE_HEADER.test(line) || /^\d+(?:[.,]\d+)?\s*€/.test(line)) kind = 'price';
      else if (PRINT_CODE.test(line)) kind = 'table';
      else if (ICON_TOKENS.test(line)) kind = 'icon';
      else if (DIMENSIONS.test(line)) kind = 'table';

      blocks.push({
        id: randomUUID(),
        page: page.pageNumber,
        kind,
        text: line,
        confidence: kind === 'text' ? 0.82 : 0.94,
        metadata: { lineIndex: index },
      });
    });

    return { ...page, blocks };
  }
}
