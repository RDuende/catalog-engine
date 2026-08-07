export const CONVERSATION_STATES = [
  "WELCOME",
  "DISCOVER",
  "UNDERSTAND",
  "INSPIRE",
  "PROPOSE",
  "REFINE",
  "CONFIRM",
  "COMPLETE",
] as const;

export type ConversationState = (typeof CONVERSATION_STATES)[number];
