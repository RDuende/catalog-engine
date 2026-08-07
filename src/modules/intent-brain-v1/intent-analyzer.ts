import {
  INTENT_LEXICON,
} from "./intent-lexicon.js";
import type {
  IntentBrainInput,
  IntentEvidence,
  IntentPrimary,
} from "./intent-brain.types.js";

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

export function analyzeIntentEvidence(
  input: IntentBrainInput,
): {
  readonly normalizedText: string;
  readonly evidence: readonly IntentEvidence[];
  readonly ranking: readonly {
    readonly intent: IntentPrimary;
    readonly score: number;
  }[];
} {
  const text =
    normalize(input.message);

  const scores =
    new Map<IntentPrimary, number>();

  const evidence:
    IntentEvidence[] = [];

  for (const entry of INTENT_LEXICON) {
    for (const pattern of entry.patterns) {
      const match =
        text.match(pattern);

      if (!match?.[0]) {
        continue;
      }

      const current =
        scores.get(entry.intent) ??
        0;

      scores.set(
        entry.intent,
        Math.min(
          1,
          current +
            entry.weight,
        ),
      );

      evidence.push(
        Object.freeze({
          text:
            match[0],
          intent:
            entry.intent,
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
    input.hasProposals &&
    /\botra\b|\bmejor\b|\bcambiar\b/iu.test(
      text,
    )
  ) {
    scores.set(
      "REFINE_PROPOSAL",
      Math.max(
        scores.get(
          "REFINE_PROPOSAL",
        ) ?? 0,
        0.78,
      ),
    );
  }

  if (
    input.hasSelectedProduct &&
    /\bfoto\b|\bnombre\b|\bfrase\b|\bcolor\b/iu.test(
      text,
    )
  ) {
    scores.set(
      "PERSONALIZE_PRODUCT",
      Math.max(
        scores.get(
          "PERSONALIZE_PRODUCT",
        ) ?? 0,
        0.86,
      ),
    );
  }

  const ranking =
    Object.freeze(
      [...scores.entries()]
        .map(
          ([intent, score]) =>
            Object.freeze({
              intent,
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
    normalizedText:
      text,
    evidence:
      Object.freeze(
        evidence,
      ),
    ranking,
  });
}
