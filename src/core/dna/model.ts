export type DnaSource = "manual" | "builder" | "import" | "ai" | "rule";

export interface DnaProvenance {
  source: DnaSource;
  sourceId?: string;
  actorId?: string;
  createdAt: string;
}

export interface DnaValue<T> {
  value: T;
  confidence: number;
  provenance: DnaProvenance;
  version: number;
}

export interface ProductDNA {
  productId: string;
  version: number;
  recipients: DnaValue<string>[];
  occasions: DnaValue<string>[];
  emotions: DnaValue<string>[];
  styles: DnaValue<string>[];
  tags: DnaValue<string>[];
  personalization?: DnaValue<boolean>;
  updatedAt: string;
}

export interface ProductDnaInput {
  productId: string;
  title: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  personalization?: boolean;
}
