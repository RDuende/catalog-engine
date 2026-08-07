import type { CommercialContextField, ContextPatch } from "../../core/commercial-context/index.js";

export type AIProviderName = "openai" | "mock";

export interface AIUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
}

export interface AITrace {
  readonly traceId: string;
  readonly provider: AIProviderName;
  readonly model: string;
  readonly skill: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly usage: AIUsage;
  readonly requestId?: string;
}

export interface StructuredAIRequest<T> {
  readonly skill: string;
  readonly system: string;
  readonly input: string;
  readonly schemaName: string;
  readonly schema: Readonly<Record<string, unknown>>;
  readonly fallback: T;
}

export interface StructuredAIResult<T> {
  readonly data: T;
  readonly trace: AITrace;
  readonly fallbackUsed: boolean;
}

export interface AIProvider {
  readonly name: AIProviderName;
  structured<T>(request: StructuredAIRequest<T>): Promise<StructuredAIResult<T>>;
}

export type {
  ConversationExtractRequest,
  ConversationIntent,
  ConversationUnderstanding,
} from "../../ai/conversation/conversation.types.js";

export type ConversationPatchField = CommercialContextField;
export type ConversationPatch = ContextPatch;
