import type {
  GiftDecision,
  GiftProfile,
  GiftSimulation,
} from "./gift-brain.types.js";

export function decideGiftStrategy(
  simulations: readonly GiftSimulation[],
  profile: GiftProfile,
): GiftDecision | undefined {
  const selected = simulations[0];
  if (!selected) return undefined;

  const second = simulations[1];
  const confidence = Math.max(
    0.5,
    Math.min(
      0.99,
      0.7 +
      (selected.finalScore - (second?.finalScore ?? 0.5)) * 0.7 +
      profile.completeness * 0.15,
    ),
  );

  return Object.freeze({
    selected,
    alternatives: Object.freeze(simulations.slice(1, 4)),
    confidence,
    composerContext: Object.freeze({
      recipientLabel: profile.recipientLabel,
      recipientCount: profile.recipientCount,
      ...(profile.age !== undefined ? { age: profile.age } : {}),
      ...(profile.occasion ? { occasion: profile.occasion } : {}),
      ...(profile.budget !== undefined ? { budget: profile.budget } : {}),
      interests: profile.interests,
      minItems:
        selected.strategy.kind === "SINGLE_PERSONALIZED" ? 1 : 2,
      maxItems:
        selected.strategy.targetItemCount,
      requirePersonalization:
        selected.strategy.kind === "PERSONALIZATION_VOUCHER" ||
        selected.strategy.kind === "SINGLE_PERSONALIZED",
      giftStrategy:
        selected.strategy.kind,
      emotionTarget:
        selected.strategy.title,
    }),
  });
}
