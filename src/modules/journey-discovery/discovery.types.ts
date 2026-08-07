import type { AddJourneyParticipantInput, SetJourneyFactInput } from "../journey-domain/index.js";

export interface DiscoveryEvidence {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export interface DiscoveryExtraction {
  readonly extractorVersion: string;
  readonly participants: readonly AddJourneyParticipantInput[];
  readonly facts: readonly SetJourneyFactInput[];
  readonly evidence: readonly DiscoveryEvidence[];
  readonly confidence: number;
}

export interface DiscoveryExtractInput {
  readonly message: string;
  readonly locale?: string;
}
