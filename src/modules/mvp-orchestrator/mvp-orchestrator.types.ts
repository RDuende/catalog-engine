import type { JourneyProjectSnapshot, SetJourneyFactInput } from "../journey-domain/index.js";
import type { DiscoveryExtraction } from "../journey-discovery/index.js";
import type { JourneyCompletenessReport } from "../journey-completeness/index.js";
import type { CreativeBrief } from "../creative-brief/index.js";
import type { StoryConceptSet } from "../story-engine/index.js";
import type { ImageBriefSet } from "../image-brief/index.js";
import type { SolutionSet } from "../solution-engine/index.js";
import type { GiftModel, JourneyDecision } from "../journey-model/index.js";
import type { RceProposalSet } from "../rce/index.js";

export type MvpJourneyMode = "DISCOVER" | "GENERATE_PROPOSALS";

export interface MvpJourneyRequest {
  readonly message: string;
  readonly mode?: MvpJourneyMode;
  readonly journeyId?: string;
  readonly sessionId?: string;
  readonly correlationId?: string;
  readonly facts?: readonly SetJourneyFactInput[];
  readonly now?: string;
  readonly journey?: JourneyProjectSnapshot;
}

export type MvpJourneyStatus = "NEEDS_INPUT" | "READY_FOR_PROPOSALS" | "COMPLETED";

export interface MvpJourneyTiming {
  readonly totalMs: number;
  readonly discoveryMs: number;
  readonly completenessMs: number;
  readonly creativeBriefMs?: number;
  readonly storiesMs?: number;
  readonly imageBriefsMs?: number;
  readonly solutionsMs?: number;
  readonly proposalsMs?: number;
}

export interface MvpJourneyResult {
  readonly status: MvpJourneyStatus;
  readonly journey: JourneyProjectSnapshot;
  readonly discovery: DiscoveryExtraction;
  readonly completeness: JourneyCompletenessReport;
  readonly missingRequired: readonly string[];
  readonly nextQuestion?: string;
  readonly giftModel?: GiftModel;
  readonly decision?: JourneyDecision;
  readonly creativeBrief?: CreativeBrief;
  readonly storySet?: StoryConceptSet;
  readonly imageBriefSet?: ImageBriefSet;
  readonly solutionSet?: SolutionSet;
  readonly proposalSet?: RceProposalSet;
  readonly timing: MvpJourneyTiming;
}
