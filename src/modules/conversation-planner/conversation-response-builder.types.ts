import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { MvpJourneyResult } from "../mvp-orchestrator/mvp-orchestrator.types.js";

export interface ConversationResponseBuilderInput {
  readonly previousJourney?: JourneyProjectSnapshot;
  readonly journey: JourneyProjectSnapshot;
  readonly engineResult: MvpJourneyResult;
  readonly suggestedReply?: string;
}

export interface ConversationResponseProgress {
  readonly qualityPercent: number;
  readonly readyForProposals: boolean;
  readonly knownFacts: readonly string[];
  readonly missingFacts: readonly string[];
  readonly message: string;
}

export interface ConversationResponse {
  readonly text: string;
  readonly summary?: string;
  readonly nextQuestion?: string;
  readonly progress: ConversationResponseProgress;
  readonly builderVersion: string;
}
