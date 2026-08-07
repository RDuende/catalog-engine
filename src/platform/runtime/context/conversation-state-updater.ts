import type {
  ConversationStateResolution,
  RaiContext,
} from "../contracts/index.js";

export function withConversationStateResolution(
  context: RaiContext,
  resolution: ConversationStateResolution,
): RaiContext {
  return Object.freeze({
    ...context,
    session: Object.freeze({
      ...context.session,
      state: resolution.resolved,
    }),
    metadata: Object.freeze({
      ...(context.metadata ?? {}),
      conversationStateResolution: resolution,
    }),
  });
}
