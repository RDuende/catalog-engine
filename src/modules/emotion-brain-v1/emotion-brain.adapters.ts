import type {
  EmotionBrainResult,
} from "./emotion-brain.types.js";

export interface GiftBrainEmotionContext {
  readonly primaryEmotion: string;
  readonly secondaryEmotions: readonly string[];
  readonly style: string;
  readonly intensity: number;
  readonly confidence: number;
  readonly memoryWeight: number;
  readonly surpriseWeight: number;
  readonly humorWeight: number;
  readonly personalizationWeight: number;
}

export interface ProposalBrainEmotionContext {
  readonly emotionTarget: string;
  readonly emotionIntensity: number;
  readonly emotionConfidence: number;
  readonly emotionWeights:
    Readonly<Record<string, number>>;
}

export function emotionContextForGiftBrain(
  result: EmotionBrainResult,
): GiftBrainEmotionContext {
  return Object.freeze({
    primaryEmotion:
      result.primaryEmotion,
    secondaryEmotions:
      result.secondaryEmotions,
    style:
      result.style,
    intensity:
      result.intensity,
    confidence:
      result.confidence,
    memoryWeight:
      result.memoryWeight,
    surpriseWeight:
      result.surpriseWeight,
    humorWeight:
      result.humorWeight,
    personalizationWeight:
      result.personalizationWeight,
  });
}

export function emotionContextForProposalBrain(
  result: EmotionBrainResult,
): ProposalBrainEmotionContext {
  return Object.freeze({
    emotionTarget:
      result.primaryEmotion,
    emotionIntensity:
      result.intensity,
    emotionConfidence:
      result.confidence,
    emotionWeights:
      Object.freeze({
        ...result.weights,
      }),
  });
}
