import { MockAIProvider, OpenAIProvider } from "../ai-gateway/index.js";
import type { AIProvider, AIProviderName } from "../ai-gateway/index.js";

export type ConfiguredAIProviderName = AIProviderName | "deterministic";

export interface AIProviderFactoryOptions {
  readonly provider?: ConfiguredAIProviderName;
  readonly openAIKey?: string;
  readonly openAIModel?: string;
  readonly openAIBaseUrl?: string;
}

export class AIProviderFactory {
  static create(options: AIProviderFactoryOptions = {}): AIProvider | undefined {
    const provider = options.provider ?? normalizeProvider(process.env.AI_PROVIDER);
    if (provider === "deterministic") return undefined;
    if (provider === "mock") return new MockAIProvider();
    return new OpenAIProvider(
      options.openAIKey ?? process.env.OPENAI_API_KEY,
      options.openAIModel ?? process.env.OPENAI_MODEL,
      options.openAIBaseUrl ?? process.env.OPENAI_API_BASE_URL,
    );
  }
}

function normalizeProvider(value: string | undefined): ConfiguredAIProviderName {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "deterministic") return "deterministic";
  if (normalized === "mock" || normalized === "openai") return normalized;
  throw new Error(`AI_PROVIDER no soportado: ${value}. Usa deterministic, mock u openai.`);
}
