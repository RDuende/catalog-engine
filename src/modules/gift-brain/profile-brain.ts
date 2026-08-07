import type {
  GiftBrainInput,
  GiftProfile,
} from "./gift-brain.types.js";

export function buildGiftProfile(
  input: GiftBrainInput,
): GiftProfile {
  const missing: string[] = [];

  if (!input.recipientLabel) missing.push("recipientLabel");
  if (!input.occasion) missing.push("occasion");
  if (input.budget === undefined) missing.push("budget");
  if (!input.interests?.length) missing.push("interests");

  const total = 4;
  const completeness =
    Math.round(
      ((total - missing.length) / total) * 100,
    ) / 100;

  return Object.freeze({
    recipientLabel:
      input.recipientLabel ?? "destinatario",
    ...(input.relationship
      ? { relationship: input.relationship }
      : {}),
    ...(input.occasion
      ? { occasion: input.occasion }
      : {}),
    ...(input.age !== undefined
      ? { age: input.age }
      : {}),
    ...(input.budget !== undefined
      ? { budget: input.budget }
      : {}),
    interests:
      Object.freeze(input.interests ?? []),
    personality:
      Object.freeze(input.personality ?? []),
    desiredImpact:
      Object.freeze(input.desiredImpact ?? []),
    recipientCount:
      Math.max(1, input.recipientCount ?? 1),
    completeness,
    missingFields:
      Object.freeze(missing),
  });
}
