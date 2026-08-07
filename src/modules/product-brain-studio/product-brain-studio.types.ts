export interface ProductBrainStudioProduct {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
  readonly provider?: string;
  readonly price?: number;
  readonly stock?: number;
  readonly tags: readonly string[];
  readonly canonicalInterests: readonly string[];
  readonly materials: readonly string[];
  readonly techniques: readonly string[];
  readonly themes: readonly string[];
  readonly roles: readonly string[];
  readonly images: readonly string[];
  readonly primaryImage?: string;
  readonly productBrain?: Readonly<Record<string, unknown>>;
  readonly raw: Readonly<Record<string, unknown>>;
}

export interface ProductBrainStudioSearchInput {
  readonly query?: string;
  readonly interest?: string;
  readonly material?: string;
  readonly technique?: string;
  readonly role?: string;
  readonly provider?: string;
  readonly warningsOnly?: boolean;
  readonly orphanOnly?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

export interface ProductBrainStudioWarning {
  readonly code:
    | "POSSIBLE_FALSE_POSITIVE"
    | "MISSING_INTERESTS"
    | "MISSING_MATERIALS"
    | "MISSING_TECHNIQUES"
    | "MISSING_ROLES"
    | "ZERO_PRICE";
  readonly severity: "INFO" | "WARNING" | "ERROR";
  readonly message: string;
  readonly evidence: readonly string[];
}

export interface ProductBrainStudioDetail {
  readonly product: ProductBrainStudioProduct;
  readonly knowledgeProfile: unknown;
  readonly enrichment: unknown;
  readonly warnings: readonly ProductBrainStudioWarning[];
  readonly xray: readonly {
    readonly stage: string;
    readonly status: "PASS" | "WARNING";
    readonly summary: string;
    readonly output: unknown;
  }[];
}

export interface ProductBrainStudioStats {
  readonly generatedAt: string;
  readonly snapshotPath: string;
  readonly totalProducts: number;
  readonly withInterests: number;
  readonly withoutInterests: number;
  readonly withMaterials: number;
  readonly withTechniques: number;
  readonly withRoles: number;
  readonly warningCount: number;
  readonly coveragePercent: number;
  readonly topInterests: readonly {
    readonly id: string;
    readonly count: number;
  }[];
  readonly topMaterials: readonly {
    readonly id: string;
    readonly count: number;
  }[];
  readonly topTechniques: readonly {
    readonly id: string;
    readonly count: number;
  }[];
}
