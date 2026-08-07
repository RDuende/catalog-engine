export type BrainStageId =
  | "INTEREST"
  | "KNOWLEDGE"
  | "GIFT"
  | "PRODUCT"
  | "PROPOSAL"
  | "COMPOSER"
  | "IMAGE"
  | "MEMORY";

export type BrainStageStatus =
  | "SKIPPED"
  | "RUNNING"
  | "COMPLETE"
  | "FAILED"
  | "WAITING_USER";

export interface BrainStageTrace {
  readonly stage: BrainStageId;
  readonly status: BrainStageStatus;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly durationMs?: number;
  readonly confidence?: number;
  readonly message: string;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

export interface BrainContext {
  readonly journeyId?: string;
  readonly sessionId?: string;
  readonly conversation: Readonly<Record<string, unknown>>;
  readonly memory?: unknown;
  readonly knowledge?: unknown;
  readonly interests?: readonly string[];
  readonly gift?: unknown;
  readonly products?: readonly unknown[];
  readonly proposal?: unknown;
  readonly composer?: unknown;
  readonly images?: unknown;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface BrainOrchestratorInput {
  readonly journeyId?: string;
  readonly sessionId?: string;
  readonly message?: string;
  readonly conversation?: Readonly<Record<string, unknown>>;
  readonly facts?: Readonly<Record<string, unknown>>;
  readonly interests?: readonly string[];
  readonly recipientLabel?: string;
  readonly occasion?: string;
  readonly age?: number;
  readonly budget?: number;
  readonly recipientCount?: number;
  readonly personality?: readonly string[];
  readonly desiredImpact?: readonly string[];
  readonly candidates?: readonly unknown[];
  readonly autoCompose?: boolean;
}

export interface BrainOrchestratorDecision {
  readonly action:
    | "ASK_USER"
    | "READY_FOR_PROPOSALS"
    | "PROPOSALS_READY"
    | "COMPOSED"
    | "FAILED";
  readonly confidence: number;
  readonly reason: string;
  readonly nextQuestion?: string;
}

export interface BrainOrchestratorResult {
  readonly runId: string;
  readonly generatedAt: string;
  readonly totalDurationMs: number;
  readonly context: BrainContext;
  readonly decision: BrainOrchestratorDecision;
  readonly stages: readonly BrainStageTrace[];
}

export interface BrainReplayRecord {
  readonly runId: string;
  readonly createdAt: string;
  readonly input: BrainOrchestratorInput;
  readonly result: BrainOrchestratorResult;
}

export interface BrainBenchmarkResult {
  readonly generatedAt: string;
  readonly runs: number;
  readonly successfulRuns: number;
  readonly failedRuns: number;
  readonly avgMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly avgConfidence: number;
}
