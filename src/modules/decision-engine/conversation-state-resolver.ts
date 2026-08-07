import type {
  ConversationState,
  ConversationStateResolution,
  RaiContext,
  RaiIntent,
} from "../../platform/runtime/contracts/index.js";

const RESOLVER_VERSION = "m3.2-conversation-state-v1";

export interface ConversationStateResolverInput {
  readonly context: RaiContext;
}

export class ConversationStateResolver {
  resolve(input: ConversationStateResolverInput): ConversationStateResolution {
    const context = input.context;
    const previous = context.session.state;
    const intent = context.conversation.intent?.primary ?? "UNKNOWN";
    const facts = context.conversation.facts ?? {};
    const resolved = resolveState(intent, facts, previous);
    const reasons = buildReasons(intent, facts, previous, resolved);

    return Object.freeze({
      previous,
      resolved,
      confidence: confidenceFor(intent, resolved, facts),
      reasons: Object.freeze(reasons),
      resolverVersion: RESOLVER_VERSION,
    });
  }
}

function resolveState(
  intent: RaiIntent,
  facts: Readonly<Record<string, unknown>>,
  previous: ConversationState,
): ConversationState {
  if (previous === "COMPLETE") return "COMPLETE";

  switch (intent) {
    case "GREETING":
      return "WELCOME";
    case "HUMAN_SUPPORT":
      return "CONFIRM";
    case "CHECK_ORDER":
    case "PRODUCT_QUESTION":
      return hasAnyFacts(facts) ? "UNDERSTAND" : "DISCOVER";
    case "EDIT_IMAGE":
    case "GENERATE_IMAGE":
      return hasImageSignal(facts) ? "PROPOSE" : "DISCOVER";
    case "RESUME_PROJECT":
      return "UNDERSTAND";
    case "PERSONALIZE_PRODUCT":
      return hasSelectedProduct(facts) ? "REFINE" : "DISCOVER";
    case "CHOOSE_PRODUCT":
      return hasGiftCore(facts) ? "PROPOSE" : "DISCOVER";
    case "CREATE_GIFT":
      if (!hasRecipient(facts) || !hasOccasion(facts)) return "DISCOVER";
      if (!hasCreativeSignal(facts)) return "INSPIRE";
      return "PROPOSE";
    case "UNKNOWN":
    default:
      return previous === "WELCOME" ? "DISCOVER" : previous;
  }
}

function buildReasons(
  intent: RaiIntent,
  facts: Readonly<Record<string, unknown>>,
  previous: ConversationState,
  resolved: ConversationState,
): string[] {
  const reasons = [`intent:${intent}`, `previous:${previous}`];
  if (resolved === "DISCOVER") reasons.push("missing_context");
  if (resolved === "INSPIRE") reasons.push("gift_core_complete_creative_signal_missing");
  if (resolved === "PROPOSE") reasons.push("sufficient_context_for_proposal");
  if (resolved === "REFINE") reasons.push("selected_product_available");
  if (hasRecipient(facts)) reasons.push("recipient_known");
  if (hasOccasion(facts)) reasons.push("occasion_known");
  return reasons;
}

function confidenceFor(
  intent: RaiIntent,
  resolved: ConversationState,
  facts: Readonly<Record<string, unknown>>,
): number {
  let value = intent === "UNKNOWN" ? 0.45 : 0.78;
  if (resolved === "DISCOVER") value += 0.05;
  if (hasRecipient(facts)) value += 0.05;
  if (hasOccasion(facts)) value += 0.05;
  if (hasSelectedProduct(facts)) value += 0.05;
  return Math.min(0.98, Number(value.toFixed(2)));
}

function hasAnyFacts(facts: Readonly<Record<string, unknown>>): boolean {
  return Object.entries(facts).some(([, value]) => value !== undefined && value !== null && value !== "");
}

function hasRecipient(facts: Readonly<Record<string, unknown>>): boolean {
  return nonEmpty(facts.recipientRelationship);
}

function hasOccasion(facts: Readonly<Record<string, unknown>>): boolean {
  return nonEmpty(facts.occasion);
}

function hasGiftCore(facts: Readonly<Record<string, unknown>>): boolean {
  return hasRecipient(facts) || hasOccasion(facts) || nonEmpty(facts.need);
}

function hasCreativeSignal(facts: Readonly<Record<string, unknown>>): boolean {
  return nonEmpty(facts.recipientInterests)
    || nonEmpty(facts.recipientPersonality)
    || nonEmpty(facts.intendedUse)
    || nonEmpty(facts.giftDiscoveryMode);
}

function hasSelectedProduct(facts: Readonly<Record<string, unknown>>): boolean {
  return nonEmpty(facts.selectedProductId);
}

function hasImageSignal(facts: Readonly<Record<string, unknown>>): boolean {
  return nonEmpty(facts.imageId) || nonEmpty(facts.assetId) || nonEmpty(facts.uploadedAssetId);
}

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}
