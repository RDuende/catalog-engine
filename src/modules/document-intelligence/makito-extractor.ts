import { randomUUID } from 'node:crypto';
import type {
  DetectedFeature,
  DetectedField,
  DetectedProduct,
  DocumentPage,
  DocumentTemplateRule,
  Evidence,
  PriceTier,
} from './document-types.js';

const DEFAULT_TEMPLATE: DocumentTemplateRule = {
  id: 'makito-essential-v1',
  supplier: 'Makito',
  version: 1,
  referencePattern: '\\b([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ-]+)\\s+(\\d{3,6})\\b',
  dimensionPattern: '\\b\\d+(?:[.,]\\d+)?\\s*[×x]\\s*\\d+(?:[.,]\\d+)?\\s*[×x]\\s*\\d+(?:[.,]\\d+)?\\s*cm\\b',
  priceQuantityPattern: '(?:-500|\\+500|\\+2000|\\+5000)',
  printCodeLabel: 'Print Code:',
  categoryHints: ['BACKPACKS', 'BAGS', 'WRITING', 'DRINKWARE', 'TECHNOLOGY'],
  featureTokens: {
    'TROLLEY STRAP': 'trolley-strap',
    'LAPTOP COMPARTMENT': 'laptop-compartment',
    'TABLET COMPARTMENT': 'tablet-compartment',
    'ANTI THEFT': 'anti-theft',
    RPET: 'recycled-material',
    DTF: 'dtf-printing',
    REFLECTIVE: 'reflective',
    USB: 'usb-connection',
    VACUUM: 'vacuum-system',
  },
  active: true,
};

function evidence(page: number, value: string, confidence = 0.95): Evidence[] {
  return [{ id: randomUUID(), page, kind: 'text', value, confidence }];
}

function field<T>(page: number, value: T, confidence: number, raw = String(value)): DetectedField<T> {
  return { value, confidence, evidence: evidence(page, raw, confidence) };
}

function normalizeDecimal(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.'));
}

function extractPriceTiers(text: string): PriceTier[] {
  const quantityLine = text.match(/-500\s+\+500\s+\+2000\s+\+5000/i);
  if (!quantityLine) return [];
  const after = text.slice((quantityLine.index ?? 0) + quantityLine[0].length);
  const euroValues = [...after.matchAll(/(\d+(?:[.,]\d+)?)\s*€/g)].slice(0, 4).map((match) => normalizeDecimal(match[1] ?? '0'));
  const quantities = [1, 500, 2000, 5000];
  return euroValues.map((unitPrice, index) => ({ minimumQuantity: quantities[index] ?? 1, unitPrice, currency: 'EUR' }));
}

function detectFeatures(page: number, rawText: string, template: DocumentTemplateRule): DetectedFeature[] {
  const upper = rawText.toUpperCase();
  const features: DetectedFeature[] = [];
  for (const [token, key] of Object.entries(template.featureTokens)) {
    if (!upper.includes(token)) continue;
    const size = token.includes('LAPTOP') || token.includes('TABLET')
      ? rawText.match(new RegExp(`${token.replace(' ', '\\s+')}\\s*(\\d{1,2})[”"]`, 'i'))?.[1]
      : undefined;
    features.push({
      key,
      value: size ? Number(size) : true,
      confidence: 0.9,
      evidence: evidence(page, size ? `${token} ${size}\"` : token, 0.9),
    });
  }
  return features;
}

function splitProducts(page: DocumentPage, template: DocumentTemplateRule): string[] {
  const regex = new RegExp(template.referencePattern, 'gm');
  const matches = [...page.text.matchAll(regex)];
  if (!matches.length) return [];
  const chunks: string[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match) continue;
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? page.text.length;
    chunks.push(page.text.slice(start, end).trim());
  }
  return chunks;
}

export class MakitoExtractor {
  readonly template: DocumentTemplateRule;

  constructor(template: DocumentTemplateRule = DEFAULT_TEMPLATE) {
    this.template = template;
  }

  extract(page: DocumentPage, documentId: string, supplier: string): DetectedProduct[] {
    const category = page.text.match(/\b(BACKPACKS|BAGS|WRITING|DRINKWARE|TECHNOLOGY|SPORTS|HOME)\b/i)?.[1];
    return splitProducts(page, this.template).map((chunk) => {
      const identity = chunk.match(new RegExp(this.template.referencePattern, 'i'));
      const name = identity?.[1];
      const reference = identity?.[2];
      const dimensions = chunk.match(new RegExp(this.template.dimensionPattern, 'i'))?.[0];
      const printCodesRaw = chunk.match(/Print\s*Code\s*:\s*([^\n]+)/i)?.[1]?.trim();
      const printCodes = printCodesRaw ? printCodesRaw.split(',').map((code) => code.trim()).filter(Boolean) : [];
      const prices = extractPriceTiers(chunk);
      const description = chunk.match(/(Mochila\.[^\n]+|Bolso Mochila\.[^\n]+|Backpack\.[^\n]+)/i)?.[1];
      const material = description?.match(/(?:Mochila|Bolso Mochila|Backpack)\.\s*([^\.]+)/i)?.[1]?.trim();
      const colors = [...chunk.matchAll(/(?:^|\s)(01|02|03|04|06|08|13|19|227)(?=\s|$)/gm)].map((m) => m[1]).filter((value): value is string => value !== undefined);
      const features = detectFeatures(page.pageNumber, chunk, this.template);
      const confidences = [name ? 0.98 : 0.2, reference ? 0.99 : 0.2, dimensions ? 0.96 : 0.4, prices.length ? 0.9 : 0.45];
      const confidence = confidences.reduce((sum, value) => sum + value, 0) / confidences.length;

      return {
        id: randomUUID(),
        documentId,
        page: page.pageNumber,
        supplier,
        name: name ? field(page.pageNumber, name, 0.98) : undefined,
        reference: reference ? field(page.pageNumber, reference, 0.99) : undefined,
        category: category ? field(page.pageNumber, category.toLowerCase(), 0.94) : undefined,
        description: description ? field(page.pageNumber, description, 0.91) : undefined,
        material: material ? field(page.pageNumber, material, 0.86) : undefined,
        dimensions: dimensions ? field(page.pageNumber, dimensions.replace(/\s+/g, ' '), 0.96) : undefined,
        packQuantity: undefined,
        printCodes: field(page.pageNumber, printCodes, printCodes.length ? 0.95 : 0.3, printCodesRaw ?? ''),
        colors: field(page.pageNumber, [...new Set(colors)], colors.length ? 0.8 : 0.3, colors.join(',')),
        prices: field(page.pageNumber, prices, prices.length ? 0.9 : 0.3, JSON.stringify(prices)),
        features,
        confidence,
        rawText: chunk,
        sourceBlockIds: page.blocks.filter((block) => block.text && chunk.includes(block.text)).map((block) => block.id),
      };
    });
  }
}

export { DEFAULT_TEMPLATE as MAKITO_TEMPLATE_V1 };
