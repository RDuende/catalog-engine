import type { ParsedIntent } from "../intent/model.js";

export interface ConversationTurn {
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly createdAt: string;
}

export interface ConversationState {
  readonly sessionId: string;
  readonly turns: readonly ConversationTurn[];
  readonly mergedIntent?: ParsedIntent;
  readonly missingFields: readonly ConversationField[];
  readonly updatedAt: string;
}

export type ConversationField = "recipient" | "occasion" | "budget" | "personalization";

export interface ConversationReply {
  readonly session: ConversationState;
  readonly nextQuestion?: string;
  readonly readyForIdeas: boolean;
}
