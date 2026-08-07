import type { ConversationState as CommercialConversationState } from "../../../core/commercial-context/index.js";
import type { ConversationState } from "../contracts/index.js";

const COMMERCIAL_TO_RUNTIME: Readonly<Record<CommercialConversationState, ConversationState>> = Object.freeze({
  WELCOME: "WELCOME",
  DISCOVERY: "DISCOVER",
  QUALIFICATION: "UNDERSTAND",
  RECOMMENDATION: "PROPOSE",
  PROPOSAL: "PROPOSE",
  ORDER: "CONFIRM",
  COLLECT_REQUIREMENTS: "DISCOVER",
  SEARCH_PRODUCTS: "UNDERSTAND",
  COMPARE_OPTIONS: "REFINE",
  BUILD_PROPOSAL: "PROPOSE",
  CONFIRM: "CONFIRM",
  FINISHED: "COMPLETE",
});

export function toRuntimeConversationState(
  state: CommercialConversationState | undefined,
  fallback: ConversationState = "DISCOVER",
): ConversationState {
  return state ? COMMERCIAL_TO_RUNTIME[state] : fallback;
}
