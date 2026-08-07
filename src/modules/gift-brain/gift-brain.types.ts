export type GiftEmotion =
  | "SURPRISE"
  | "NOSTALGIA"
  | "JOY"
  | "PRIDE"
  | "TENDERNESS"
  | "HUMOR"
  | "ELEGANCE"
  | "UTILITY";

export type GiftStrategyKind =
  | "SINGLE_PERSONALIZED"
  | "HERO_PLUS_COMPLEMENTS"
  | "EMOTIONAL_BUNDLE"
  | "PREMIUM_GIFT_BOX"
  | "PERSONALIZATION_VOUCHER"
  | "SHARED_EXPERIENCE";

export interface GiftBrainInput {
  readonly journeyId?: string;
  readonly recipientLabel?: string;
  readonly relationship?: string;
  readonly occasion?: string;
  readonly age?: number;
  readonly budget?: number;
  readonly interests?: readonly string[];
  readonly personality?: readonly string[];
  readonly desiredImpact?: readonly string[];
  readonly recipientCount?: number;
  readonly facts?: Readonly<Record<string, unknown>>;
}

export interface GiftProfile {
  readonly recipientLabel: string;
  readonly relationship?: string;
  readonly occasion?: string;
  readonly age?: number;
  readonly budget?: number;
  readonly interests: readonly string[];
  readonly personality: readonly string[];
  readonly desiredImpact: readonly string[];
  readonly recipientCount: number;
  readonly completeness: number;
  readonly missingFields: readonly string[];
}

export interface GiftIntent {
  readonly primaryGoal:
    | "EMOTION"
    | "UTILITY"
    | "SURPRISE"
    | "CELEBRATION"
    | "MEMORY"
    | "SHARED_MOMENT";
  readonly confidence: number;
  readonly reasons: readonly string[];
}

export interface EmotionPlan {
  readonly primary: GiftEmotion;
  readonly secondary: readonly GiftEmotion[];
  readonly intensity: number;
  readonly reasons: readonly string[];
}

export interface GiftStrategy {
  readonly id: string;
  readonly kind: GiftStrategyKind;
  readonly title: string;
  readonly description: string;
  readonly targetItemCount: number;
  readonly estimatedBudgetShare: {
    readonly hero: number;
    readonly complements: number;
    readonly message: number;
    readonly packaging: number;
  };
  readonly score: number;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
}

export interface GiftSimulation {
  readonly strategy: GiftStrategy;
  readonly emotionalScore: number;
  readonly commercialScore: number;
  readonly feasibilityScore: number;
  readonly personalizationScore: number;
  readonly finalScore: number;
  readonly explanation: string;
}

export interface GiftDecision {
  readonly selected: GiftSimulation;
  readonly alternatives: readonly GiftSimulation[];
  readonly confidence: number;
  readonly composerContext: Readonly<Record<string, unknown>>;
}

export interface GiftBrainTrace {
  readonly phase:
    | "PROFILE"
    | "INTENT"
    | "EMOTION"
    | "STRATEGY"
    | "SIMULATION"
    | "DECISION";
  readonly message: string;
  readonly data?: unknown;
}

export interface GiftBrainResult {
  readonly generatedAt: string;
  readonly profile: GiftProfile;
  readonly intent: GiftIntent;
  readonly emotion: EmotionPlan;
  readonly strategies: readonly GiftStrategy[];
  readonly simulations: readonly GiftSimulation[];
  readonly decision?: GiftDecision;
  readonly readyForProposals: boolean;
  readonly nextQuestion?: string;
  readonly traces: readonly GiftBrainTrace[];
}
