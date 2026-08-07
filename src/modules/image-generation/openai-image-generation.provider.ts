import { randomUUID } from "node:crypto";
import type { GeneratedImage, ImageGenerationProvider, ImageGenerationRequest } from "./image-generation.types.js";

interface OpenAIImageResponse {
  readonly data?: readonly { readonly b64_json?: string; readonly revised_prompt?: string }[];
  readonly error?: { readonly message?: string };
}

export class OpenAIImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "openai" as const;

  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
    private readonly baseUrl = process.env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1",
  ) {}

  async generate(request: ImageGenerationRequest, signal?: AbortSignal): Promise<GeneratedImage> {
    if (!this.apiKey) throw new Error("Falta OPENAI_API_KEY.");
    const prompt = [
      request.brief.aiPrompt ?? request.brief.promptSeed,
      request.brief.negativePrompt ? `Evitar: ${request.brief.negativePrompt}` : "",
    ].filter(Boolean).join("\n\n");

    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        size: request.size ?? sizeFromAspectRatio(request.brief.aspectRatio),
        quality: request.quality ?? "medium",
        output_format: request.format ?? "png",
      }),
    });

    const body = await response.json() as OpenAIImageResponse;
    if (!response.ok) throw new Error(body.error?.message ?? `OpenAI Images respondió ${response.status}.`);
    const first = body.data?.[0];
    if (!first?.b64_json) throw new Error("OpenAI Images no devolvió contenido base64.");

    return Object.freeze({
      id: randomUUID(),
      provider: this.name,
      model: this.model,
      format: request.format ?? "png",
      size: request.size ?? sizeFromAspectRatio(request.brief.aspectRatio),
      base64: first.b64_json,
      ...(first.revised_prompt ? { revisedPrompt: first.revised_prompt } : {}),
      createdAt: new Date().toISOString(),
    });
  }
}

function sizeFromAspectRatio(aspectRatio: string): "1024x1024" | "1024x1536" | "1536x1024" {
  if (aspectRatio === "4:5") return "1024x1536";
  if (aspectRatio === "16:9" || aspectRatio === "3:2") return "1536x1024";
  return "1024x1024";
}
