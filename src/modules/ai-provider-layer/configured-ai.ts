import { StoryEngine } from "../story-engine/index.js";
import type { AIProvider } from "../ai-gateway/index.js";
import { AIProviderFactory, type AIProviderFactoryOptions } from "./ai-provider.factory.js";
import { AIImagePromptEnhancer } from "./ai-image-prompt-enhancer.js";
import { AIStoryConceptProvider } from "./ai-story-provider.js";

export interface ConfiguredCreativeAI {
  readonly provider?: AIProvider;
  readonly storyEngine: StoryEngine;
  readonly imagePromptEnhancer?: AIImagePromptEnhancer;
}

export function createConfiguredCreativeAI(options: AIProviderFactoryOptions = {}): ConfiguredCreativeAI {
  const provider = AIProviderFactory.create({
    ...options,
    provider: options.provider ?? normalizeCreativeProvider(process.env.CREATIVE_AI_PROVIDER),
    openAIModel: options.openAIModel ?? process.env.CREATIVE_AI_MODEL ?? process.env.OPENAI_MODEL,
  });
  if (!provider) return Object.freeze({ storyEngine: new StoryEngine() });
  return Object.freeze({
    provider,
    storyEngine: new StoryEngine({ provider: new AIStoryConceptProvider(provider) }),
    imagePromptEnhancer: new AIImagePromptEnhancer(provider),
  });
}

function normalizeCreativeProvider(value: string | undefined): AIProviderFactoryOptions["provider"] {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "deterministic") return "deterministic";
  if (normalized === "mock" || normalized === "openai") return normalized;
  throw new Error(`CREATIVE_AI_PROVIDER no soportado: ${value}. Usa deterministic, mock u openai.`);
}
