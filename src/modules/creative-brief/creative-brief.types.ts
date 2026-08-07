import type { JourneyFactSource, JourneyProjectSnapshot } from "../journey-domain/index.js";

export type CreativeBriefStatus = "DRAFT" | "READY" | "INVALID";
export type EmotionalGoal =
  | "SURPRISE" | "CONNECTION" | "CELEBRATION" | "GRATITUDE" | "PRIDE" | "REMEMBRANCE" | "FUN";
export type NarrativeStyle = "ADVENTURE" | "MAGICAL" | "HUMOROUS" | "EMOTIONAL" | "CELEBRATORY" | "NEUTRAL";
export type VisualStyle = "COLORFUL_ILLUSTRATION" | "COMIC" | "WATERCOLOR" | "MINIMAL" | "PHOTOGRAPHIC" | "BRAND_ALIGNED" | "UNSPECIFIED";

export interface CreativeBriefSource {
  readonly field: string;
  readonly factKey?: string;
  readonly source: JourneyFactSource | "RULE" | "PARTICIPANT" | "GIFT_MODEL";
  readonly confidence: number;
  readonly reason: string;
}
export interface CreativeAudienceProfile {
  readonly participantId: string;
  readonly role: string;
  readonly name?: string;
  readonly age?: number;
  readonly relationship?: string;
  readonly interests: readonly string[];
}
export interface CreativeBudget { readonly maximum: number; readonly currency: string; }
export interface CreativePersonalization {
  readonly enabled?: boolean;
  readonly name?: string;
  readonly includePhoto?: boolean;
  readonly phrase?: string;
}
export interface CreativeDirection {
  readonly tone: readonly string[];
  readonly themes: readonly string[];
  readonly emotionalGoal: string;
}
export interface CreativeConstraint {
  readonly id: string;
  readonly kind: "BUDGET" | "AUDIENCE" | "CONTENT" | "PRODUCTION" | "MISSING_DATA";
  readonly description: string;
  readonly blocking: boolean;
}
export interface CreativeBriefValidationIssue {
  readonly code: string;
  readonly field: string;
  readonly severity: "ERROR" | "WARNING";
  readonly message: string;
}
export interface CreativeBriefValidation { readonly valid: boolean; readonly issues: readonly CreativeBriefValidationIssue[]; }
export interface CreativeBriefQualityGate {
  readonly passed: boolean;
  readonly score: number;
  readonly blockingIssues: readonly string[];
  readonly warnings: readonly string[];
}
export interface CreativeBrief {
  readonly id: string;
  readonly specificationVersion: "v2";
  readonly builderVersion: "creative-brief-v2-gift-model";
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly version: number;
  readonly fingerprint: string;
  readonly status: CreativeBriefStatus;
  readonly objective: string;
  readonly audience: readonly CreativeAudienceProfile[];
  readonly occasion?: string;
  readonly occasionDateText?: string;
  readonly emotionalGoals: readonly EmotionalGoal[];
  readonly themes: readonly string[];
  readonly narrativeStyle: NarrativeStyle;
  readonly visualStyle: VisualStyle;
  readonly creativeDirection: CreativeDirection;
  readonly personalization: CreativePersonalization;
  readonly budget?: CreativeBudget;
  readonly constraints: readonly CreativeConstraint[];
  readonly pendingFacts: readonly string[];
  readonly sources: readonly CreativeBriefSource[];
  readonly validation: CreativeBriefValidation;
  readonly qualityGate: CreativeBriefQualityGate;
  readonly createdAt: string;
}
export interface BuildCreativeBriefInput { readonly journey: JourneyProjectSnapshot; readonly id?: string; readonly now?: string; }
export interface CreativeBriefBuildResult { readonly brief: CreativeBrief; readonly journey: JourneyProjectSnapshot; }
export interface ApplyCreativeBriefOptions { readonly force?: boolean; }
