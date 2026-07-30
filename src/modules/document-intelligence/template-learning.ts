import type { DetectedProduct, DocumentTemplateRule } from './document-types.js';

export interface TemplateObservation {
  supplier: string;
  field: 'reference' | 'dimensions' | 'printCodes' | 'prices' | 'features';
  success: boolean;
  productId: string;
}

export interface TemplateLearningReport {
  templateId: string;
  observations: number;
  successRate: number;
  proposedChanges: string[];
}

export class TemplateLearner {
  evaluate(template: DocumentTemplateRule, products: DetectedProduct[]): TemplateLearningReport {
    const observations = products.flatMap((product): TemplateObservation[] => [
      { supplier: product.supplier, field: 'reference', success: Boolean(product.reference), productId: product.id },
      { supplier: product.supplier, field: 'dimensions', success: Boolean(product.dimensions), productId: product.id },
      { supplier: product.supplier, field: 'printCodes', success: product.printCodes.value.length > 0, productId: product.id },
      { supplier: product.supplier, field: 'prices', success: product.prices.value.length > 0, productId: product.id },
      { supplier: product.supplier, field: 'features', success: product.features.length > 0, productId: product.id },
    ]);
    const successes = observations.filter((observation) => observation.success).length;
    const successRate = observations.length ? successes / observations.length : 0;
    const proposedChanges: string[] = [];
    if (products.some((product) => !product.reference)) proposedChanges.push('Revisar patrón de referencia');
    if (products.some((product) => !product.dimensions)) proposedChanges.push('Añadir patrón alternativo de dimensiones');
    if (products.filter((product) => !product.prices.value.length).length > products.length * 0.25) {
      proposedChanges.push('Revisar detector de tabla de precios');
    }
    return { templateId: template.id, observations: observations.length, successRate, proposedChanges };
  }
}
