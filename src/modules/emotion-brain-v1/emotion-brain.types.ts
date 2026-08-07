export type EmotionPrimary =
  | "JOY"
  | "SURPRISE"
  | "GRATITUDE"
  | "NOSTALGIA"
  | "TENDERNESS"
  | "PRIDE"
  | "HUMOR"
  | "RECONCILIATION"
  | "LOVE"
  | "ADMIRATION"
  | "CELEBRATION"
  | "UTILITY";

export type EmotionStyle =
  | "SENTIMENTAL"
  | "PLAYFUL"
  | "ELEGANT"
  | "INTIMATE"
  | "CELEBRATORY"
  | "PRACTICAL"
  | "NOSTALGIC";

export interface EmotionEvidence {
  readonly text: string;
  readonly emotion: EmotionPrimary;
  readonly weight: number;
  readonly reason: string;
}

export interface EmotionWeights {
  readonly joy: number;
  readonly surprise: number;
  readonly gratitude: number;
  readonly nostalgia: number;
  readonly tenderness: number;
  readonly pride: number;
  readonly humor: number;
  readonly reconciliation: number;
  readonly love: number;
  readonly admiration: number;
  readonly celebration: number;
  readonly utility: number;
}

export interface EmotionBrainInput {
  readonly message?: string;
  readonly messages?: readonly string[];
  readonly occasion?: string;
  readonly relationship?: string;
  readonly desiredImpact?: readonly string[];
  readonly personality?: readonly string[];
  readonly facts?: Readonly<Record<string, unknown>>;
}

export interface EmotionBrainResult {
  readonly generatedAt: string;
  readonly primaryEmotion: EmotionPrimary;
  readonly secondaryEmotions: readonly EmotionPrimary[];
  readonly style: EmotionStyle;
  readonly intensity: number;
  readonly confidence: number;
  readonly memoryWeight: number;
  readonly surpriseWeight: number;
  readonly humorWeight: number;
  readonly personalizationWeight: number;
  readonly weights: EmotionWeights;
  readonly evidence: readonly EmotionEvidence[];
  readonly explanation: string;
  readonly traces: readonly EmotionTrace[];
}

export interface EmotionTrace {
  readonly phase:
    | "NORMALIZE"
    | "EVIDENCE"
    | "WEIGHTS"
    | "STYLE"
    | "DECISION";
  readonly message: string;
  readonly data?: unknown;
}
