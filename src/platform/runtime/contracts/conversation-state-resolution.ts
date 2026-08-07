import type { ConversationState } from "./conversation-state.js";

export interface ConversationStateResolution {
  readonly previous: ConversationState;
  readonly resolved: ConversationState;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly resolverVersion: string;
}
