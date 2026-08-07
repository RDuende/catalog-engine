export interface InterestDefinition {
  readonly id: string;
  readonly domain: string;
  readonly displayName: {
    readonly es: string;
    readonly en: string;
  };
  readonly aliases: readonly string[];
  readonly strongTerms: readonly string[];
  readonly contextTerms: readonly string[];
}

export interface InterestMatch {
  readonly interestId: string;
  readonly displayName: string;
  readonly domain: string;
  readonly confidence: number;
  readonly matchedTerms: readonly string[];
  readonly evidence: readonly string[];
}

export interface InterestExpansion {
  readonly canonicalIds: readonly string[];
  readonly directTerms: readonly string[];
  readonly strongTerms: readonly string[];
  readonly contextTerms: readonly string[];
}
