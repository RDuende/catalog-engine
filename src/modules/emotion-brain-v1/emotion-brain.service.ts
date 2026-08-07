import {
  analyzeEmotionEvidence,
} from "./emotion-analyzer.js";
import type {
  EmotionBrainInput,
  EmotionBrainResult,
  EmotionPrimary,
  EmotionStyle,
  EmotionTrace,
} from "./emotion-brain.types.js";

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

function styleFor(
  primary: EmotionPrimary,
): EmotionStyle {
  switch (primary) {
    case "HUMOR":
      return "PLAYFUL";

    case "GRATITUDE":
    case "TENDERNESS":
    case "LOVE":
    case "RECONCILIATION":
      return "SENTIMENTAL";

    case "NOSTALGIA":
      return "NOSTALGIC";

    case "CELEBRATION":
    case "JOY":
    case "SURPRISE":
      return "CELEBRATORY";

    case "UTILITY":
      return "PRACTICAL";

    case "PRIDE":
    case "ADMIRATION":
      return "ELEGANT";
  }
}

export class EmotionBrainService {
  analyze(
    input: EmotionBrainInput,
  ): EmotionBrainResult {
    const traces:
      EmotionTrace[] = [];

    const analyzed =
      analyzeEmotionEvidence(
        input,
      );

    traces.push({
      phase: "NORMALIZE",
      message:
        "Texto emocional normalizado.",
      data:
        analyzed.normalizedText,
    });

    traces.push({
      phase: "EVIDENCE",
      message:
        `${analyzed.evidence.length} evidencias emocionales detectadas.`,
      data:
        analyzed.evidence,
    });

    const first =
      analyzed.ranking[0];

    const primaryEmotion:
      EmotionPrimary =
      first?.emotion ??
      "JOY";

    const secondaryEmotions =
      Object.freeze(
        analyzed.ranking
          .filter(
            (item) =>
              item.emotion !==
                primaryEmotion &&
              item.score >= 0.45,
          )
          .slice(0, 3)
          .map(
            (item) =>
              item.emotion,
          ),
      );

    const topScore =
      first?.score ??
      0.45;

    const evidenceStrength =
      analyzed.evidence.length
        ? analyzed.evidence.reduce<number>(
            (sum, item) =>
              sum + item.weight,
            0,
          ) /
          analyzed.evidence.length
        : 0.45;

    const intensity =
      clamp(
        topScore * 0.7 +
        evidenceStrength * 0.3,
      );

    /*
     * Confidence expresa la seguridad de la inferencia, no la intensidad.
     *
     * Una evidencia textual fuerte y explícita debe poder superar el 70%
     * incluso aunque exista una sola evidencia. La fórmula anterior partía
     * de 0.45 y sólo añadía +0.08 por evidencia, dejando una señal 0.98 en
     * ~0.65 de confidence.
     *
     * Ahora combinamos:
     * - fuerza de la emoción ganadora;
     * - fuerza media de las evidencias;
     * - cantidad de evidencias independientes.
     *
     * Sin evidencia explícita seguimos siendo conservadores.
     */
    const confidence =
      analyzed.evidence.length
        ? clamp(
            0.35 +
            topScore * 0.28 +
            evidenceStrength * 0.22 +
            Math.min(
              0.14,
              analyzed.evidence.length *
                0.05,
            ),
          )
        : 0.45;

    const style =
      styleFor(
        primaryEmotion,
      );

    const memoryWeight =
      clamp(
        analyzed.weights
          .nostalgia *
          0.65 +
        analyzed.weights
          .gratitude *
          0.3 +
        analyzed.weights
          .tenderness *
          0.25,
      );

    const surpriseWeight =
      clamp(
        analyzed.weights
          .surprise +
        (
          primaryEmotion ===
          "JOY"
            ? 0.15
            : 0
        ),
      );

    const humorWeight =
      analyzed.weights.humor;

    const personalizationWeight =
      clamp(
        0.55 +
        (
          analyzed.weights
            .gratitude +
          analyzed.weights
            .nostalgia +
          analyzed.weights
            .tenderness +
          analyzed.weights
            .love
        ) *
          0.12,
      );

    traces.push({
      phase: "WEIGHTS",
      message:
        "Pesos emocionales calculados.",
      data:
        analyzed.weights,
    });

    traces.push({
      phase: "STYLE",
      message:
        `Estilo emocional seleccionado: ${style}.`,
    });

    const explanation =
      analyzed.evidence.length
        ? `La emoción principal es ${primaryEmotion} porque el mensaje contiene ${analyzed.evidence
            .slice(0, 3)
            .map(
              (item) =>
                `"${item.text}"`,
            )
            .join(", ")}.`
        : `No hay una señal emocional explícita fuerte; se adopta ${primaryEmotion} como objetivo base.`;

    traces.push({
      phase: "DECISION",
      message:
        `Emoción principal ${primaryEmotion}, intensidad ${(intensity * 100).toFixed(0)}% y confianza ${(confidence * 100).toFixed(0)}%.`,
    });

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      primaryEmotion,
      secondaryEmotions,
      style,
      intensity,
      confidence,
      memoryWeight,
      surpriseWeight,
      humorWeight,
      personalizationWeight,
      weights:
        analyzed.weights,
      evidence:
        analyzed.evidence,
      explanation,
      traces:
        Object.freeze(traces),
    });
  }
}

export const defaultEmotionBrain =
  new EmotionBrainService();
