import type { JourneyType } from "../journey-domain/index.js";

export type CompletenessRequirementLevel = "REQUIRED" | "RECOMMENDED";

export interface CompletenessRequirement {
  readonly key: string;
  readonly label: string;
  readonly level: CompletenessRequirementLevel;
  readonly weight: number;
  readonly minimumConfidence?: number;
}

export interface CompletenessProfile {
  readonly id: string;
  readonly version: string;
  readonly journeyTypes: readonly JourneyType[];
  readonly requirements: readonly CompletenessRequirement[];
  readonly inspirationThreshold: number;
}

export interface CompletenessRequirementResult {
  readonly key: string;
  readonly label: string;
  readonly level: CompletenessRequirementLevel;
  readonly weight: number;
  readonly satisfied: boolean;
  readonly confidence: number;
  readonly source: "FACT" | "PARTICIPANT" | "MISSING";
}

export interface JourneyCompletenessReport {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly score: number;
  readonly requiredScore: number;
  readonly recommendedScore: number;
  readonly requiredComplete: boolean;
  readonly readyForInspiration: boolean;
  readonly satisfiedKeys: readonly string[];
  readonly missingRequired: readonly string[];
  readonly missingRecommended: readonly string[];
  readonly requirements: readonly CompletenessRequirementResult[];
  readonly evaluatedAt: string;
}
