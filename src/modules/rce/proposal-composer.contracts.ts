import type { RceComposedSolution } from "./solution-composer.contracts.js";

export type RceProposalActionType =
  | "SELECT"
  | "SAVE_FAVORITE"
  | "CUSTOMIZE"
  | "COMPARE"
  | "SHOW_DETAILS";

export interface RceProposalAction {
  readonly type: RceProposalActionType;
  readonly label: string;
  readonly enabled: boolean;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface RceProposalMedia {
  readonly imageUrl?: string;
  readonly prompt?: string;
  readonly aspectRatio?: string;
  readonly alt: string;
}

export interface RceProposalProductionInfo {
  readonly estimatedDays?: number;
  readonly technique?: string;
  readonly available: boolean;
}

export interface RceProposalCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly emotionalStory?: string;
  readonly whyItFits: readonly string[];
  readonly price?: number;
  readonly withinBudget: boolean;
  readonly score: number;
  readonly media: RceProposalMedia;
  readonly production: RceProposalProductionInfo;
  readonly actions: readonly RceProposalAction[];
  readonly badges: readonly string[];
  readonly sourceSolutionId: string;
}

export interface RceProposalComparisonRow {
  readonly key: string;
  readonly label: string;
  readonly values: Readonly<Record<string, string | number | boolean | undefined>>;
}

export interface RceProposalSet {
  readonly conversationId: string;
  readonly proposals: readonly RceProposalCard[];
  readonly comparison: readonly RceProposalComparisonRow[];
  readonly generatedAt: string;
  readonly version: number;
}

export interface RceProposalComposerInput {
  readonly conversationId: string;
  readonly solutions: readonly RceComposedSolution[];
  readonly selectedProposalId?: string;
}

export interface RceProposalComposerMetrics {
  readonly compositions: number;
  readonly generatedProposals: number;
  readonly emptyInputs: number;
}
