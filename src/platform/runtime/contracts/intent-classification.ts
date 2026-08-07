export const RAI_INTENTS = [
  "GREETING",
  "CREATE_GIFT",
  "PERSONALIZE_PRODUCT",
  "CHOOSE_PRODUCT",
  "EDIT_IMAGE",
  "GENERATE_IMAGE",
  "RESUME_PROJECT",
  "CHECK_ORDER",
  "PRODUCT_QUESTION",
  "HUMAN_SUPPORT",
  "UNKNOWN",
] as const;

export type RaiIntent = (typeof RAI_INTENTS)[number];

export interface RaiIntentCandidate {
  readonly intent: RaiIntent;
  readonly score: number;
  readonly evidence: readonly string[];
}

export interface RaiIntentClassification {
  readonly primary: RaiIntent;
  readonly confidence: number;
  readonly candidates: readonly RaiIntentCandidate[];
  readonly source: "RULE" | "CONTEXT_FALLBACK" | "DEFAULT";
  readonly classifierVersion: string;
}
