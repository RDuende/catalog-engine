import { randomUUID } from "node:crypto";
import type { GeneratedImage, ImageGenerationProvider, ImageGenerationRequest } from "./image-generation.types.js";

const ONE_PIXEL_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=";

export class MockImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "mock" as const;

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    return Object.freeze({
      id: randomUUID(),
      provider: this.name,
      model: "mock-image-v1",
      format: request.format ?? "png",
      size: request.size ?? "1024x1024",
      base64: ONE_PIXEL_PNG,
      revisedPrompt: request.brief.aiPrompt ?? request.brief.promptSeed,
      createdAt: new Date().toISOString(),
    });
  }
}
