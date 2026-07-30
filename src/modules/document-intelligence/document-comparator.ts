import type { DetectedProduct, DocumentAnalysisResult } from './document-types.js';

export interface ProductChange {
  reference: string;
  type: 'new' | 'removed' | 'changed' | 'unchanged';
  fields: string[];
}

function mapByReference(products: DetectedProduct[]): Map<string, DetectedProduct> {
  return new Map(products.filter((product) => product.reference).map((product) => [product.reference!.value, product]));
}

export function compareDocumentAnalyses(previous: DocumentAnalysisResult, current: DocumentAnalysisResult): ProductChange[] {
  const before = mapByReference(previous.products);
  const after = mapByReference(current.products);
  const references = new Set([...before.keys(), ...after.keys()]);
  return [...references].map((reference) => {
    const oldProduct = before.get(reference);
    const newProduct = after.get(reference);
    if (!oldProduct) return { reference, type: 'new', fields: [] };
    if (!newProduct) return { reference, type: 'removed', fields: [] };
    const fields: string[] = [];
    if (oldProduct.name?.value !== newProduct.name?.value) fields.push('name');
    if (oldProduct.material?.value !== newProduct.material?.value) fields.push('material');
    if (oldProduct.dimensions?.value !== newProduct.dimensions?.value) fields.push('dimensions');
    if (JSON.stringify(oldProduct.prices.value) !== JSON.stringify(newProduct.prices.value)) fields.push('prices');
    if (JSON.stringify(oldProduct.printCodes.value) !== JSON.stringify(newProduct.printCodes.value)) fields.push('printCodes');
    return { reference, type: fields.length ? 'changed' : 'unchanged', fields };
  });
}
