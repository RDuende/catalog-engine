import type {
  EmotionPlan,
  GiftProfile,
  GiftSimulation,
  GiftStrategy,
} from "./gift-brain.types.js";

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function simulateGiftStrategies(
  strategies: readonly GiftStrategy[],
  profile: GiftProfile,
  emotion: EmotionPlan,
): readonly GiftSimulation[] {
  const budget = profile.budget ?? 0;

  return Object.freeze(
    strategies
      .map((strategy) => {
        const emotionalScore = clamp(
          strategy.score * 0.65 +
          emotion.intensity * 0.35,
        );

        const commercialScore = clamp(
          budget <= 0
            ? 0.55
            : strategy.targetItemCount === 1
              ? budget <= 35 ? 0.9 : 0.7
              : budget >= 45 ? 0.88 : 0.58,
        );

        const feasibilityScore = clamp(
          0.92 -
          strategy.warnings.length * 0.18,
        );

        const personalizationScore = clamp(
          strategy.kind === "PERSONALIZATION_VOUCHER"
            ? 0.98
            : strategy.kind === "SINGLE_PERSONALIZED"
              ? 0.94
              : 0.82,
        );

        const finalScore =
          emotionalScore * 0.4 +
          commercialScore * 0.2 +
          feasibilityScore * 0.22 +
          personalizationScore * 0.18;

        return Object.freeze({
          strategy,
          emotionalScore,
          commercialScore,
          feasibilityScore,
          personalizationScore,
          finalScore,
          explanation:
            `${strategy.title}: emoción ${(emotionalScore * 100).toFixed(0)}%, ` +
            `viabilidad ${(feasibilityScore * 100).toFixed(0)}% y ` +
            `personalización ${(personalizationScore * 100).toFixed(0)}%.`,
        });
      })
      .sort((a, b) => b.finalScore - a.finalScore),
  );
}
