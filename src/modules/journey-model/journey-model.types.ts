import type { JourneyProjectSnapshot } from "../journey-domain/index.js";

export type JourneyFactLifecycle = "DETECTED" | "CONFIRMED" | "UPDATED" | "REJECTED";

export interface JourneyFactVersion {
  readonly value: unknown;
  readonly confidence: number;
  readonly source: string;
  readonly evidence?: string;
  readonly changedAt: string;
}

export type JourneyQualityDimensionId =
  | "recipient"
  | "interests"
  | "occasion"
  | "budget"
  | "personalization"
  | "delivery"
  | "style";

export interface JourneyQualityDimension {
  readonly id: JourneyQualityDimensionId;
  readonly label: string;
  readonly weight: number;
  readonly score: number;
  readonly weightedScore: number;
  readonly status: "EMPTY" | "PARTIAL" | "STRONG";
  readonly facts: readonly string[];
  readonly missing: readonly string[];
}

export interface JourneyQualityReport {
  readonly score: number;
  readonly requiredComplete: boolean;
  readonly dimensions: readonly JourneyQualityDimension[];
  readonly missing: readonly string[];
  readonly strengths: readonly string[];
  readonly evaluatedAt: string;
}

export interface ProposalReadiness {
  readonly ready: boolean;
  readonly level: "NOT_READY" | "PARTIAL" | "STRONG";
  readonly score: number;
  readonly reasons: readonly string[];
  readonly blockers: readonly string[];
  readonly canOfferButton: boolean;
}

export interface PlannedQuestion {
  readonly factKey: string;
  readonly question: string;
  readonly priority: number;
  readonly informationGain: number;
  readonly reason: string;
}

export interface GiftModel {
  readonly journeyId: string;
  readonly recipient: {
    readonly count?: number;
    readonly name?: string;
    readonly age?: number;
    readonly relationship?: string;
    readonly interests: readonly string[];
    readonly personality: readonly string[];
  };
  readonly occasion: {
    readonly type?: string;
    readonly dateText?: string;
  };
  readonly budget: {
    readonly max?: number;
    readonly currency: string;
  };
  readonly personalization: {
    readonly enabled?: boolean;
    readonly name?: string;
    readonly photoAvailable?: boolean;
    readonly phrase?: string;
  };
  readonly style: readonly string[];
  readonly constraints: {
    readonly deliveryText?: string;
  };
  readonly quality: JourneyQualityReport;
  readonly readiness: ProposalReadiness;
  readonly generatedAt: string;
}

export interface JourneyDecision {
  readonly state: "DISCOVERY" | "READY_FOR_PROPOSALS";
  readonly nextFact?: string;
  readonly nextQuestion?: string;
  readonly plannedQuestion?: PlannedQuestion;
  readonly proposalReadiness: ProposalReadiness;
  readonly giftModel: GiftModel;
}

export interface GiftModelBuilder {
  build(snapshot: JourneyProjectSnapshot, now?: string): GiftModel;
}
