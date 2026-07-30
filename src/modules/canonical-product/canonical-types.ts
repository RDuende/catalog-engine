export interface ProviderOffer {
  id: string;
  provider: string;
  reference: string;
  price?: number;
  stock?: number;
  leadTimeDays?: number;
  sourcePages: number[];
  metadata?: Record<string, unknown>;
}

export interface CanonicalProduct {
  id: string;
  name: string;
  description?: string;
  categories: unknown[];
  materials: unknown[];
  terms: unknown[];
  variants: unknown[];
  offers: ProviderOffer[];
  sourceReferences: unknown[];
  confidence: number;
  [key: string]: unknown;
}
