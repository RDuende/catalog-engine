export interface RceImageCriteria {
  readonly relationship?: string;
  readonly age?: number;
  readonly occasion?: string;
  readonly interests: readonly string[];
  readonly style: readonly string[];
  readonly emotionalGoals: readonly string[];
  readonly productIds: readonly string[];
  readonly storySeedIds: readonly string[];
  readonly personalization: Readonly<Record<string, unknown>>;
  readonly variantCount: number;
}

export interface RceImageVariant {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly negativePrompt?: string;
  readonly aspectRatio?: string;
  readonly composition?: string;
  readonly productId?: string;
  readonly storySeedId?: string;
  readonly score?: number;
  readonly reasons?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RceImageRuntimeResult {
  readonly criteria: RceImageCriteria;
  readonly variants: readonly RceImageVariant[];
  readonly source: string;
  readonly durationMs: number;
  readonly generatedAt: string;
}

export interface RceImagePreparationPort {
  prepare(
    criteria: RceImageCriteria,
  ): Promise<readonly RceImageVariant[]>;
}

export interface RceImageRuntimeMetrics {
  readonly preparations: number;
  readonly cacheHits: number;
  readonly supersededResults: number;
  readonly failures: number;
}
