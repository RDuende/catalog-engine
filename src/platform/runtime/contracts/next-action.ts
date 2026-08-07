export const NEXT_ACTIONS = [
  "FAST_REPLY",
  "ASK_QUESTION",
  "SEARCH_KNOWLEDGE",
  "BUILD_STORY",
  "BUILD_SOLUTION",
  "GENERATE_IMAGE",
  "CREATE_PROJECT",
  "CREATE_PROPOSAL",
  "COMPLETE",
  "ESCALATE",
] as const;

export type NextAction = (typeof NEXT_ACTIONS)[number];

export function isNextAction(value: unknown): value is NextAction {
  return typeof value === "string" && (NEXT_ACTIONS as readonly string[]).includes(value);
}
