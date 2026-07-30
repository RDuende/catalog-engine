import assert from 'node:assert/strict';
import test from 'node:test';
import { DocumentLoader } from './document-loader.js';
import { MemoryDocumentStore } from './document-store.js';
import { DocumentIntelligenceEngine } from './document-intelligence-engine.js';
import { MakitoExtractor, MAKITO_TEMPLATE_V1 } from './makito-extractor.js';
import { TemplateLearner } from './template-learning.js';
import { compareDocumentAnalyses } from './document-comparator.js';

const makitoPage = `7 BACKPACKS
Nymeria 22439
30 × 40 × 14 cm
10
Print Code: G(1), N(8), O, DTF3
TROLLEY STRAP
LAPTOP COMPARTMENT 15”
Mochila al Vacío. Poliéster 600D RPET. Parte Trasera y Cintas Acolchadas. Bomba de Vacío Incluida.
-500 +500 +2000 +5000
45 € 43 € 41 € 39,40 €`;

test('extracts a Makito product with prices, features and evidence', async () => {
  const loader = new DocumentLoader();
  const snapshot = loader.load({ supplier: 'Makito', sourceType: 'pdf', fileName: 'makito.pdf', pages: [{ pageNumber: 7, text: makitoPage }] });
  const store = new MemoryDocumentStore();
  const result = await new DocumentIntelligenceEngine(store).analyze(snapshot);
  assert.equal(result.products.length, 1);
  const product = result.products[0];
  assert.ok(product);
  assert.equal(product.reference?.value, '22439');
  assert.equal(product.name?.value, 'Nymeria');
  assert.equal(product.dimensions?.value, '30 × 40 × 14 cm');
  assert.equal(product.prices.value[3]?.unitPrice, 39.4);
  assert.ok(product.features.some((feature) => feature.key === 'trolley-strap'));
  assert.ok(product.features.some((feature) => feature.key === 'recycled-material'));
  assert.ok(product.printCodes.evidence.length > 0);
});

test('builds a reusable supplier template learning report', () => {
  const page = { pageNumber: 7, text: makitoPage, blocks: [] };
  const products = new MakitoExtractor().extract(page, 'doc-1', 'Makito');
  const report = new TemplateLearner().evaluate(MAKITO_TEMPLATE_V1, products);
  assert.equal(report.templateId, 'makito-essential-v1');
  assert.equal(report.successRate, 1);
});

test('compares document versions without overwriting history', async () => {
  const loader = new DocumentLoader();
  const store = new MemoryDocumentStore();
  const engine = new DocumentIntelligenceEngine(store);
  const previous = await engine.analyze(loader.load({ supplier: 'Makito', sourceType: 'pdf', fileName: '2026.pdf', pages: [{ pageNumber: 7, text: makitoPage }] }));
  const current = await engine.analyze(loader.load({ supplier: 'Makito', sourceType: 'pdf', fileName: '2027.pdf', pages: [{ pageNumber: 7, text: makitoPage.replace('39,40 €', '38,90 €') }] }));
  const changes = compareDocumentAnalyses(previous, current);
  assert.equal(changes[0]?.type, 'changed');
  assert.deepEqual(changes[0]?.fields, ['prices']);
});
