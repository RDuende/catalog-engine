export type ConversationNodeKind =
  | "USER"
  | "RAI"
  | "QUESTION"
  | "DECISION"
  | "CONTRADICTION"
  | "PROPOSAL"
  | "SYSTEM";

export type ConversationFactKey =
  | "recipientLabel"
  | "relationship"
  | "occasion"
  | "age"
  | "budget"
  | "recipientCount"
  | "interests"
  | "personality"
  | "desiredImpact"
  | "giftCount"
  | "style";

export interface ConversationFact {
  readonly key: ConversationFactKey;
  readonly value: unknown;
  readonly confidence: number;
  readonly sourceNodeId?: string;
  readonly updatedAt: string;
}

export interface ConversationNode {
  readonly id: string;
  readonly parentId?: string;
  readonly kind: ConversationNodeKind;
  readonly createdAt: string;
  readonly text: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ConversationContradiction {
  readonly id: string;
  readonly keys: readonly ConversationFactKey[];
  readonly severity: "LOW" | "MEDIUM" | "HIGH";
  readonly summary: string;
  readonly question: string;
}

export interface ConversationQuestionPlan {
  readonly key: ConversationFactKey;
  readonly question: string;
  readonly reason: string;
  readonly priority: number;
  readonly required: boolean;
}

export interface ConversationGraph {
  readonly conversationId: string;
  readonly rootNodeId: string;
  readonly activeNodeId: string;
  readonly nodes: readonly ConversationNode[];
  readonly facts: readonly ConversationFact[];
  readonly contradictions: readonly ConversationContradiction[];
  readonly pendingQuestions: readonly ConversationQuestionPlan[];
  readonly version: number;
}

export interface ConversationEngineInput {
  readonly conversationId?: string;
  readonly parentNodeId?: string;
  readonly message?: string;
  readonly facts?: Partial<Record<ConversationFactKey, unknown>>;
  readonly graph?: ConversationGraph;
  readonly candidates?: readonly unknown[];
  readonly autoCompose?: boolean;
}

export interface ConversationEngineDecision {
  readonly action:
    | "ASK"
    | "RESOLVE_CONTRADICTION"
    | "READY_FOR_PROPOSALS"
    | "PROPOSALS_READY"
    | "COMPOSED";
  readonly text: string;
  readonly confidence: number;
  readonly reason: string;
  readonly question?: ConversationQuestionPlan;
}

export interface ConversationEngineResult {
  readonly generatedAt: string;
  readonly graph: ConversationGraph;
  readonly decision: ConversationEngineDecision;
  readonly orchestrator?: unknown;
  readonly traces: readonly {
    readonly phase:
      | "INGEST"
      | "FACTS"
      | "CONTRADICTIONS"
      | "QUESTIONS"
      | "ORCHESTRATOR"
      | "RESPONSE";
    readonly message: string;
    readonly data?: unknown;
  }[];
}
