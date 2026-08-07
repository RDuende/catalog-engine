export type MemoryFactKind =
  | "RECIPIENT"
  | "RECIPIENT_COUNT"
  | "RELATIONSHIP"
  | "AGE"
  | "INTEREST"
  | "BUDGET"
  | "OCCASION"
  | "MATERIAL_PREFERENCE"
  | "PRODUCT_PREFERENCE"
  | "PRODUCT_REJECTION"
  | "STYLE_PREFERENCE"
  | "MESSAGE"
  | "CUSTOM";

export type MemoryFactStatus =
  | "INFERRED"
  | "CONFIRMED"
  | "SUPERSEDED"
  | "REJECTED";

export interface MemoryFact<T = unknown> {
  readonly id: string;
  readonly kind: MemoryFactKind;
  readonly key: string;
  readonly value: T;
  readonly normalizedValue: string;
  readonly confidence: number;
  readonly status: MemoryFactStatus;
  readonly sourceMessageId: string;
  readonly sourceText: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly supersedesFactId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MemoryQuestion {
  readonly id: string;
  readonly key: string;
  readonly text: string;
  readonly priority: number;
  readonly askedAt?: string;
  readonly answeredAt?: string;
  readonly skippedAt?: string;
  readonly reason: string;
}

export interface MemoryDecision {
  readonly id: string;
  readonly type:
    | "ACCEPTED"
    | "REJECTED"
    | "SELECTED"
    | "DISMISSED";
  readonly targetId: string;
  readonly note?: string;
  readonly createdAt: string;
}

export interface JourneyMemory {
  readonly journeyId: string;
  readonly ownerId: string;
  readonly version: number;
  readonly facts: readonly MemoryFact[];
  readonly questions: readonly MemoryQuestion[];
  readonly decisions: readonly MemoryDecision[];
  readonly seenProposalIds: readonly string[];
  readonly rejectedProductIds: readonly string[];
  readonly selectedProductIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MemoryMessageInput {
  readonly id: string;
  readonly text: string;
  readonly createdAt?: string;
  readonly extractedFacts?: readonly MemoryFactInput[];
}

export interface MemoryFactInput<T = unknown> {
  readonly kind: MemoryFactKind;
  readonly key: string;
  readonly value: T;
  readonly confidence?: number;
  readonly confirmed?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MemoryStore {
  get(
    journeyId: string,
    ownerId: string,
  ): Promise<JourneyMemory | undefined>;

  save(
    memory: JourneyMemory,
  ): Promise<void>;
}

export interface MemoryDiscoveryState {
  readonly knownKeys: readonly string[];
  readonly missingKeys: readonly string[];
  readonly nextQuestion?: MemoryQuestion;
  readonly completionPercent: number;
}

export interface MemorySnapshot {
  readonly journeyId: string;
  readonly profile: {
    readonly recipients: readonly string[];
    readonly recipientCount?: number;
    readonly relationships: readonly string[];
    readonly ages: readonly number[];
    readonly interests: readonly string[];
    readonly budget?: number;
    readonly occasions: readonly string[];
    readonly preferredMaterials: readonly string[];
    readonly preferredProducts: readonly string[];
    readonly rejectedProducts: readonly string[];
    readonly styles: readonly string[];
  };
  readonly discovery: MemoryDiscoveryState;
  readonly unansweredQuestions: readonly MemoryQuestion[];
  readonly decisions: readonly MemoryDecision[];
}
