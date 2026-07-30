import type { DocumentStore } from './document-store.js';
import { LayoutAnalyzer } from './layout-analyzer.js';
import { MakitoExtractor } from './makito-extractor.js';
import type { AnalysisIssue, DocumentAnalysisResult, DocumentSnapshot } from './document-types.js';

export class DocumentIntelligenceEngine {
  constructor(
    private readonly store: DocumentStore,
    private readonly layoutAnalyzer = new LayoutAnalyzer(),
    private readonly makitoExtractor = new MakitoExtractor(),
  ) {}

  async analyze(snapshot: DocumentSnapshot): Promise<DocumentAnalysisResult> {
    const analysedPages = snapshot.pages.map((page) => this.layoutAnalyzer.analyze(page));
    const analysedSnapshot: DocumentSnapshot = {
      ...snapshot,
      pages: analysedPages,
      templateId: this.makitoExtractor.template.id,
      status: 'analysing',
    };

    const products = analysedPages.flatMap((page) =>
      this.makitoExtractor.extract(page, analysedSnapshot.id, analysedSnapshot.supplier),
    );
    const issues: AnalysisIssue[] = [];
    for (const product of products) {
      if (product.confidence < 0.7) {
        issues.push({
          id: `low-confidence-${product.id}`,
          severity: 'warning',
          code: 'LOW_CONFIDENCE_PRODUCT',
          message: 'El producto requiere revisión manual',
          page: product.page,
          productId: product.id,
        });
      }
      if (!product.reference) {
        issues.push({
          id: `missing-reference-${product.id}`,
          severity: 'error',
          code: 'MISSING_REFERENCE',
          message: 'No se ha detectado la referencia',
          page: product.page,
          productId: product.id,
        });
      }
    }

    const averageConfidence = products.length
      ? products.reduce((sum, product) => sum + product.confidence, 0) / products.length
      : 0;
    const finalSnapshot: DocumentSnapshot = {
      ...analysedSnapshot,
      status: issues.some((issue) => issue.severity === 'error') ? 'review_required' : 'analysed',
    };
    const result: DocumentAnalysisResult = {
      snapshot: finalSnapshot,
      products,
      issues,
      metrics: {
        pages: finalSnapshot.pages.length,
        products: products.length,
        averageConfidence,
        lowConfidenceProducts: products.filter((product) => product.confidence < 0.7).length,
        detectedTables: finalSnapshot.pages.flatMap((page) => page.blocks).filter((block) => block.kind === 'table' || block.kind === 'price').length,
        detectedImages: finalSnapshot.pages.flatMap((page) => page.blocks).filter((block) => block.kind === 'image').length,
        detectedIcons: finalSnapshot.pages.flatMap((page) => page.blocks).filter((block) => block.kind === 'icon').length,
      },
    };
    await this.store.saveAnalysis(result);
    return result;
  }
}
