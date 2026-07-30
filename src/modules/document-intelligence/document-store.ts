import type { DocumentAnalysisResult, DocumentSnapshot, DocumentTemplateRule } from './document-types.js';

export interface DocumentStore {
  saveSnapshot(snapshot: DocumentSnapshot): Promise<void>;
  getSnapshot(id: string): Promise<DocumentSnapshot | undefined>;
  saveAnalysis(result: DocumentAnalysisResult): Promise<void>;
  getAnalysis(documentId: string): Promise<DocumentAnalysisResult | undefined>;
  saveTemplate(template: DocumentTemplateRule): Promise<void>;
  listTemplates(supplier?: string): Promise<DocumentTemplateRule[]>;
}

export class MemoryDocumentStore implements DocumentStore {
  private snapshots = new Map<string, DocumentSnapshot>();
  private analyses = new Map<string, DocumentAnalysisResult>();
  private templates = new Map<string, DocumentTemplateRule>();

  async saveSnapshot(snapshot: DocumentSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, structuredClone(snapshot));
  }

  async getSnapshot(id: string): Promise<DocumentSnapshot | undefined> {
    const value = this.snapshots.get(id);
    return value ? structuredClone(value) : undefined;
  }

  async saveAnalysis(result: DocumentAnalysisResult): Promise<void> {
    this.analyses.set(result.snapshot.id, structuredClone(result));
    await this.saveSnapshot(result.snapshot);
  }

  async getAnalysis(documentId: string): Promise<DocumentAnalysisResult | undefined> {
    const value = this.analyses.get(documentId);
    return value ? structuredClone(value) : undefined;
  }

  async saveTemplate(template: DocumentTemplateRule): Promise<void> {
    this.templates.set(template.id, structuredClone(template));
  }

  async listTemplates(supplier?: string): Promise<DocumentTemplateRule[]> {
    return [...this.templates.values()]
      .filter((item) => !supplier || item.supplier.toLowerCase() === supplier.toLowerCase())
      .map((item) => structuredClone(item));
  }
}
