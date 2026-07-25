import type { Product, Recommendation } from "../domain/entities.js";
import type { CatalogDomainEvent } from "../events/domain-events.js";

export interface EventBus {
  publish(event: CatalogDomainEvent): Promise<void>;
  publishMany(events: readonly CatalogDomainEvent[]): Promise<void>;
}

export interface ImportSource {
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly bytes: Uint8Array;
}

export interface ImportAnalysis {
  readonly provider: string | null;
  readonly productCount: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly readyToImport: boolean;
}

export interface ImportAdapter {
  readonly code: string;
  supports(source: ImportSource): Promise<boolean>;
  analyze(source: ImportSource): Promise<ImportAnalysis>;
  import(source: ImportSource): AsyncIterable<Product>;
}

export interface RecommendationRequest {
  readonly query: string;
  readonly limit?: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface RecommendationProvider {
  recommend(request: RecommendationRequest): Promise<readonly Recommendation[]>;
}
