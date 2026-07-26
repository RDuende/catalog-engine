export interface CatalogDialect {
  id: string;
  displayName: string;
  score(text: string): number;
  materialAliases: Readonly<Record<string, string>>;
  techniqueAliases: Readonly<Record<string, string>>;
}

export class UniversalDialect implements CatalogDialect {
  id = "universal";
  displayName = "Universal Catalog Dialect";
  materialAliases = {};
  techniqueAliases = {};
  score(_text: string): number { return 0.1; }
}

export class DialectRegistry {
  private readonly dialects = new Map<string, CatalogDialect>();

  register(dialect: CatalogDialect): void { this.dialects.set(dialect.id, dialect); }

  detect(text: string): { dialect: CatalogDialect; confidence: number } {
    const candidates = [...this.dialects.values()]
      .map((dialect) => ({ dialect, confidence: Math.max(0, Math.min(1, dialect.score(text))) }))
      .sort((a, b) => b.confidence - a.confidence);
    const best = candidates[0];
    if (!best) throw new Error("No catalog dialects registered");
    return best;
  }
}
