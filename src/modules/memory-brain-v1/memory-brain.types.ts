export type MemoryKind =
  | "RECIPIENT"
  | "INTEREST"
  | "PREFERENCE"
  | "GIFT_HISTORY"
  | "BUDGET_PATTERN"
  | "OCCASION"
  | "RELATIONSHIP"
  | "STYLE"
  | "FACT";

export type MemoryScope =
  | "SESSION"
  | "RECIPIENT"
  | "USER";

export type MemorySource =
  | "USER_EXPLICIT"
  | "CONVERSATION"
  | "INFERENCE"
  | "ORDER"
  | "CORRECTION"
  | "IMPORT";

export interface MemoryRecord {
  readonly id: string;
  readonly subjectKey: string;
  readonly kind: MemoryKind;
  readonly scope: MemoryScope;
  readonly key: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly source: MemorySource;
  readonly sourceRef?: string;
  readonly learnedAt: string;
  readonly updatedAt: string;
  readonly validUntil?: string;
  readonly supersedes?: string;
  readonly tags: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MemoryConflict {
  readonly id: string;
  readonly subjectKey: string;
  readonly key: string;
  readonly previous: MemoryRecord;
  readonly incoming: MemoryRecord;
  readonly resolution:
    | "KEEP_PREVIOUS"
    | "USE_INCOMING"
    | "MERGE"
    | "REVIEW";
  readonly reason: string;
}

export interface MemoryQuery {
  readonly subjectKey?: string;
  readonly kinds?: readonly MemoryKind[];
  readonly keys?: readonly string[];
  readonly minConfidence?: number;
  readonly includeExpired?: boolean;
}

export interface MemorySnapshot {
  readonly generatedAt: string;
  readonly subjectKey: string;
  readonly records: readonly MemoryRecord[];
  readonly summary: Readonly<Record<string, unknown>>;
}

export interface MemoryLearnInput {
  readonly subjectKey: string;
  readonly kind: MemoryKind;
  readonly scope?: MemoryScope;
  readonly key: string;
  readonly value: unknown;
  readonly confidence?: number;
  readonly source?: MemorySource;
  readonly sourceRef?: string;
  readonly validUntil?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface MemoryLearnResult {
  readonly record: MemoryRecord;
  readonly conflict?: MemoryConflict;
  readonly replaced?: MemoryRecord;
}

export interface ConversationMemoryInput {
  readonly conversationId?: string;
  readonly recipientLabel?: string;
  readonly relationship?: string;
  readonly occasion?: string;
  readonly age?: number;
  readonly budget?: number;
  readonly recipientCount?: number;
  readonly interests?: readonly string[];
  readonly personality?: readonly string[];
  readonly desiredImpact?: readonly string[];
  readonly facts?: Readonly<Record<string, unknown>>;
}

export interface GiftHistoryInput {
  readonly subjectKey: string;
  readonly orderId?: string;
  readonly proposalId?: string;
  readonly occasion?: string;
  readonly giftedAt?: string;
  readonly products: readonly {
    readonly productId: string;
    readonly sku?: string;
    readonly name: string;
    readonly category?: string;
  }[];
  readonly total?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
