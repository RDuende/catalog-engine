export type DocumentSourceType = 'pdf' | 'xlsx' | 'csv' | 'xml' | 'json' | 'html';
export type DocumentStatus = 'uploaded' | 'analysing' | 'analysed' | 'review_required' | 'approved' | 'failed';
export type BlockKind = 'text' | 'image' | 'table' | 'icon' | 'price' | 'product' | 'unknown';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Evidence {
  id: string;
  page: number;
  kind: 'text' | 'image' | 'icon' | 'table' | 'rule' | 'human';
  value: string;
  confidence: number;
  bbox?: BoundingBox;
  ruleId?: string;
}

export interface DocumentBlock {
  id: string;
  page: number;
  kind: BlockKind;
  text?: string;
  bbox?: BoundingBox;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentPage {
  pageNumber: number;
  width?: number;
  height?: number;
  text: string;
  blocks: DocumentBlock[];
}

export interface DocumentSnapshot {
  id: string;
  supplier: string;
  sourceType: DocumentSourceType;
  fileName: string;
  sha256: string;
  engineVersion: string;
  templateId?: string;
  createdAt: string;
  status: DocumentStatus;
  pages: DocumentPage[];
  metadata: Record<string, unknown>;
}

export interface PriceTier {
  minimumQuantity: number;
  unitPrice: number;
  currency: 'EUR';
}

export interface DetectedFeature {
  key: string;
  value: string | number | boolean;
  confidence: number;
  evidence: Evidence[];
}

export interface DetectedField<T = string> {
  value: T;
  confidence: number;
  evidence: Evidence[];
}

export interface DetectedProduct {
  id: string;
  documentId: string;
  page: number;
  supplier: string;
  name?: DetectedField;
  reference?: DetectedField;
  category?: DetectedField;
  description?: DetectedField;
  material?: DetectedField;
  dimensions?: DetectedField;
  packQuantity?: DetectedField<number>;
  printCodes: DetectedField<string[]>;
  colors: DetectedField<string[]>;
  prices: DetectedField<PriceTier[]>;
  features: DetectedFeature[];
  confidence: number;
  rawText: string;
  sourceBlockIds: string[];
}

export interface DocumentTemplateRule {
  id: string;
  supplier: string;
  version: number;
  referencePattern: string;
  dimensionPattern: string;
  priceQuantityPattern: string;
  printCodeLabel: string;
  categoryHints: string[];
  featureTokens: Record<string, string>;
  active: boolean;
}

export interface AnalysisIssue {
  id: string;
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  page?: number;
  productId?: string;
}

export interface DocumentAnalysisResult {
  snapshot: DocumentSnapshot;
  products: DetectedProduct[];
  issues: AnalysisIssue[];
  metrics: {
    pages: number;
    products: number;
    averageConfidence: number;
    lowConfidenceProducts: number;
    detectedTables: number;
    detectedImages: number;
    detectedIcons: number;
  };
}
