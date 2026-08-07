export type JourneyType =
  | "GIFT"
  | "VOUCHER"
  | "EVENT"
  | "ORGANIZATION"
  | "MEMORY"
  | "CUSTOM";

export type JourneyStatus =
  | "DRAFT"
  | "DISCOVERING"
  | "READY_FOR_INSPIRATION"
  | "INSPIRING"
  | "PROPOSING"
  | "REFINING"
  | "AWAITING_APPROVAL"
  | "READY_FOR_COMMERCE"
  | "ORDERED"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type ParticipantRole =
  | "OWNER"
  | "BUYER"
  | "RECIPIENT"
  | "CONTRIBUTOR"
  | "APPROVER"
  | "ORGANIZER"
  | "COMPANION"
  | "ORGANIZATION"
  | "TEAM"
  | "PET";

export type JourneyFactSource =
  | "USER"
  | "CONVERSATION"
  | "INFERENCE"
  | "IMPORT"
  | "SYSTEM";

export type JourneyArtifactType =
  | "STORY"
  | "IMAGE"
  | "DESIGN"
  | "MOCKUP"
  | "PROPOSAL"
  | "PRODUCT_SELECTION"
  | "CREATIVE_BRIEF"
  | "DOCUMENT"
  | "OTHER";

export interface JourneyParticipant {
  readonly id: string;
  readonly role: ParticipantRole;
  readonly name?: string;
  readonly age?: number;
  readonly relationship?: string;
  readonly preferences: Readonly<Record<string, unknown>>;
  readonly facts: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type JourneyFactStatus = "DETECTED" | "CONFIRMED" | "UPDATED" | "REJECTED";

export interface JourneyFactVersion {
  readonly value: unknown;
  readonly confidence: number;
  readonly source: JourneyFactSource;
  readonly evidence?: string;
  readonly changedAt: string;
}

export interface JourneyFact {
  readonly id?: string;
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly source: JourneyFactSource;
  readonly participantId?: string;
  readonly evidence?: string;
  readonly sourceMessageId?: string;
  readonly status?: JourneyFactStatus;
  readonly history?: readonly JourneyFactVersion[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface JourneyArtifact {
  readonly id: string;
  readonly type: JourneyArtifactType;
  readonly version: number;
  readonly status: "DRAFT" | "READY" | "APPROVED" | "REJECTED" | "SUPERSEDED";
  readonly title?: string;
  readonly uri?: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface JourneyProjectSnapshot {
  readonly id: string;
  readonly type: JourneyType;
  readonly status: JourneyStatus;
  readonly version: number;
  readonly title?: string;
  readonly ownerId?: string;
  readonly sessionId?: string;
  readonly correlationId?: string;
  readonly participants: readonly JourneyParticipant[];
  readonly facts: readonly JourneyFact[];
  readonly artifacts: readonly JourneyArtifact[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateJourneyProjectInput {
  readonly id?: string;
  readonly type: JourneyType;
  readonly title?: string;
  readonly ownerId?: string;
  readonly sessionId?: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly now?: string;
}

export interface AddJourneyParticipantInput {
  readonly id?: string;
  readonly role: ParticipantRole;
  readonly name?: string;
  readonly age?: number;
  readonly relationship?: string;
  readonly preferences?: Readonly<Record<string, unknown>>;
  readonly facts?: Readonly<Record<string, unknown>>;
  readonly now?: string;
}

export interface SetJourneyFactInput {
  readonly key: string;
  readonly value: unknown;
  readonly confidence?: number;
  readonly source: JourneyFactSource;
  readonly participantId?: string;
  readonly evidence?: string;
  readonly sourceMessageId?: string;
  readonly status?: JourneyFactStatus;
  readonly merge?: "REPLACE" | "APPEND_UNIQUE";
  readonly now?: string;
}

export interface AddJourneyArtifactInput {
  readonly id?: string;
  readonly type: JourneyArtifactType;
  readonly status?: JourneyArtifact["status"];
  readonly title?: string;
  readonly uri?: string;
  readonly data?: Readonly<Record<string, unknown>>;
  readonly now?: string;
}
