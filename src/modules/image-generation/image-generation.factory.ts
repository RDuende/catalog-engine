import type { ImageGenerationProvider } from "./image-generation.types.js";
import { MockImageGenerationProvider } from "./mock-image-generation.provider.js";
import { OpenAIImageGenerationProvider } from "./openai-image-generation.provider.js";

export function createImageGenerationProvider(): ImageGenerationProvider {
  const provider = (process.env.IMAGE_PROVIDER ?? "mock").trim().toLowerCase();
  if (provider === "mock") return new MockImageGenerationProvider();
  if (provider === "openai") return new OpenAIImageGenerationProvider();
  throw new Error(`IMAGE_PROVIDER no soportado: ${provider}. Usa mock u openai.`);
}
