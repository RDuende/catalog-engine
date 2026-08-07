import type { CommercialContext, ContextPatch } from "../../core/commercial-context/index.js";
import type { RecommendationResponse } from "../recommendation-engine/recommendation.types.js";

export interface AgentMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface ConversationalAgentRequest {
  readonly message: string;
  readonly context?: CommercialContext;
  readonly history?: readonly AgentMessage[];
  readonly limit?: number;
}

export interface AgentToolCallTrace {
  readonly callId: string;
  readonly name: string;
  readonly arguments: Readonly<Record<string, unknown>>;
  readonly durationMs: number;
  readonly resultSummary: string;
}

export interface ConversationalAgentResult {
  readonly agentId: string;
  readonly status: "COMPLETED" | "FAILED";
  readonly reply: string;
  readonly context: CommercialContext;
  readonly recommendation?: RecommendationResponse;
  readonly toolCalls: readonly AgentToolCallTrace[];
  readonly patches: readonly ContextPatch[];
  readonly model: string;
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly totalTokens: number;
  };
  readonly durationMs: number;
  readonly startedAt: string;
}

export interface AgentModelFunctionCall {
  readonly type: "function_call";
  readonly callId: string;
  readonly name: string;
  readonly arguments: string;
}

export interface AgentModelTurn {
  readonly responseId: string;
  readonly model: string;
  readonly text: string;
  readonly functionCalls: readonly AgentModelFunctionCall[];
  readonly usage: { readonly inputTokens: number; readonly outputTokens: number; readonly totalTokens: number };
}

export interface AgentModelRequest {
  readonly instructions: string;
  readonly input: unknown;
  readonly tools: readonly unknown[];
}

export interface AgentModelProvider {
  createTurn(request: AgentModelRequest): Promise<AgentModelTurn>;
}
