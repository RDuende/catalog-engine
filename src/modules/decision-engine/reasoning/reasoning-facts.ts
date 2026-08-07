import type { RaiContext, ReasoningFacts } from "../../../platform/runtime/contracts/index.js";

const CREATIVE_FIELDS = ["recipientInterests", "recipientPersonality", "intendedUse", "giftDiscoveryMode"] as const;
const IMAGE_FIELDS = ["imageId", "assetId", "uploadedAssetId"] as const;

export class ReasoningFactsCollector {
  collect(context: RaiContext): ReasoningFacts {
    const values = context.conversation.facts ?? {};
    const intent = context.conversation.intent?.primary ?? "UNKNOWN";
    const recipientKnown = nonEmpty(values.recipientRelationship);
    const occasionKnown = nonEmpty(values.occasion);
    const selectedProductKnown = nonEmpty(values.selectedProductId);
    const creativeSignalKnown = CREATIVE_FIELDS.some((field) => nonEmpty(values[field]));
    const imageAvailable = IMAGE_FIELDS.some((field) => nonEmpty(values[field]));
    const projectAvailable = Boolean(context.project?.projectId);
    const missingFields = requiredMissing(intent, {
      recipientKnown,
      occasionKnown,
      selectedProductKnown,
      imageAvailable,
      projectAvailable,
    });

    return Object.freeze({
      intent,
      conversationState: context.session.state,
      recipientKnown,
      occasionKnown,
      selectedProductKnown,
      creativeSignalKnown,
      imageAvailable,
      projectAvailable,
      missingFields: Object.freeze(missingFields),
      values: Object.freeze({ ...values }),
    });
  }
}

function requiredMissing(
  intent: ReasoningFacts["intent"],
  flags: Pick<ReasoningFacts, "recipientKnown" | "occasionKnown" | "selectedProductKnown" | "imageAvailable" | "projectAvailable">,
): string[] {
  const missing: string[] = [];
  if (intent === "CREATE_GIFT") {
    if (!flags.recipientKnown) missing.push("recipientRelationship");
    if (!flags.occasionKnown) missing.push("occasion");
  }
  if (intent === "PERSONALIZE_PRODUCT" && !flags.selectedProductKnown) missing.push("selectedProductId");
  if (intent === "EDIT_IMAGE" && !flags.imageAvailable) missing.push("imageAsset");
  if (intent === "RESUME_PROJECT" && !flags.projectAvailable) missing.push("projectId");
  return missing;
}

function nonEmpty(value: unknown): boolean {
  return typeof value === "string"
    ? value.trim().length > 0
    : value !== undefined && value !== null;
}
