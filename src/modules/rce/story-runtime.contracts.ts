export interface RceStoryCriteria {
  readonly relationship?: string;
  readonly age?: number;
  readonly occasion?: string;
  readonly interests: readonly string[];
  readonly style: readonly string[];
  readonly emotionalGoals: readonly string[];
  readonly recipientCount?: number;
  readonly limit: number;
}

export interface RceStorySeed {
  readonly id: string;
  readonly title: string;
  readonly premise: string;
  readonly tone: string;
  readonly emotionalGoal: string;
  readonly personalizationIdeas: readonly string[];
  readonly score?: number;
  readonly reasons?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RceStoryRuntimeResult {
  readonly criteria: RceStoryCriteria;
  readonly seeds: readonly RceStorySeed[];
  readonly source: string;
  readonly durationMs: number;
  readonly generatedAt: string;
}

export interface RceStoryGenerationPort {
  generate(
    criteria: RceStoryCriteria,
  ): Promise<readonly RceStorySeed[]>;
}

export interface RceStoryRuntimeMetrics {
  readonly generations: number;
  readonly cacheHits: number;
  readonly supersededResults: number;
  readonly failures: number;
}
