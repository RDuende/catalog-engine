import {
  EMOTION_LEXICON,
} from "./emotion-lexicon.js";
import type {
  EmotionBrainInput,
  EmotionEvidence,
  EmotionPrimary,
  EmotionWeights,
} from "./emotion-brain.types.js";

function normalize(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/gu,
      "",
    )
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

function emptyWeights(): Record<EmotionPrimary, number> {
  return {
    JOY: 0,
    SURPRISE: 0,
    GRATITUDE: 0,
    NOSTALGIA: 0,
    TENDERNESS: 0,
    PRIDE: 0,
    HUMOR: 0,
    RECONCILIATION: 0,
    LOVE: 0,
    ADMIRATION: 0,
    CELEBRATION: 0,
    UTILITY: 0,
  };
}

function toWeights(
  values: Readonly<Record<EmotionPrimary, number>>,
): EmotionWeights {
  return Object.freeze({
    joy: values.JOY,
    surprise: values.SURPRISE,
    gratitude: values.GRATITUDE,
    nostalgia: values.NOSTALGIA,
    tenderness: values.TENDERNESS,
    pride: values.PRIDE,
    humor: values.HUMOR,
    reconciliation: values.RECONCILIATION,
    love: values.LOVE,
    admiration: values.ADMIRATION,
    celebration: values.CELEBRATION,
    utility: values.UTILITY,
  });
}

export function analyzeEmotionEvidence(
  input: EmotionBrainInput,
): {
  readonly evidence: readonly EmotionEvidence[];
  readonly weights: EmotionWeights;
  readonly ranking: readonly {
    readonly emotion: EmotionPrimary;
    readonly score: number;
  }[];
  readonly normalizedText: string;
} {
  const raw = [
    input.message ?? "",
    ...(input.messages ?? []),
    ...(input.desiredImpact ?? []),
    input.occasion ?? "",
    input.relationship ?? "",
    ...(input.personality ?? []),
  ].join(" ");

  const text = normalize(raw);
  const values = emptyWeights();
  const evidence: EmotionEvidence[] = [];

  for (const entry of EMOTION_LEXICON) {
    for (const pattern of entry.patterns) {
      const match = text.match(pattern);

      if (!match?.[0]) {
        continue;
      }

      values[entry.emotion] =
        Math.min(
          1,
          values[entry.emotion] +
            entry.weight,
        );

      evidence.push(
        Object.freeze({
          text: match[0],
          emotion:
            entry.emotion,
          weight:
            entry.weight,
          reason:
            entry.reason,
        }),
      );

      break;
    }
  }

  if (
    values.TENDERNESS === 0 &&
    values.GRATITUDE === 0 &&
    values.HUMOR === 0 &&
    values.RECONCILIATION === 0 &&
    values.LOVE === 0 &&
    values.SURPRISE === 0
  ) {
    values.JOY =
      Math.max(
        values.JOY,
        0.45,
      );
  }

  const ranking =
    Object.freeze(
      (
        Object.entries(values) as
          [EmotionPrimary, number][]
      )
        .map(
          ([emotion, score]) =>
            Object.freeze({
              emotion,
              score,
            }),
        )
        .sort(
          (left, right) =>
            right.score -
            left.score,
        ),
    );

  return Object.freeze({
    evidence:
      Object.freeze(evidence),
    weights:
      toWeights(values),
    ranking,
    normalizedText:
      text,
  });
}
