export type IntelligenceStageStatus = "COMPLETED" | "WARNING" | "SKIPPED";

export type IntelligenceStage = {
  readonly id: string;
  readonly label: string;
  readonly status: IntelligenceStageStatus;
  readonly durationMs: number;
  readonly summary: string;
  readonly input?: unknown;
  readonly output?: unknown;
};

export type AiLabScenario = {
  readonly message: string;
  readonly recipient?: string;
  readonly age?: number;
  readonly occasion?: string;
  readonly budget?: number;
  readonly interests?: readonly string[];
  readonly emotionalGoals?: readonly string[];
  readonly visualStyle?: string;
  readonly limit?: number;
};

export type IntelligenceTrace = {
  readonly id: string;
  readonly createdAt: string;
  readonly scenario: AiLabScenario;
  readonly giftProfile: Record<string, unknown>;
  readonly recommendations: readonly unknown[];
  readonly stages: readonly IntelligenceStage[];
  readonly totals: {
    readonly durationMs: number;
    readonly recommendations: number;
    readonly warnings: number;
  };
};
