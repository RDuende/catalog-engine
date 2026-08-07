import type { ArtifactSnapshot } from "../artifact-domain/index.js";
import type { ImageBrief } from "../image-brief/index.js";

export type ImageGenerationProviderName = "mock" | "openai";
export type GeneratedImageFormat = "png" | "jpeg" | "webp";
export type GeneratedImageSize = "1024x1024" | "1024x1536" | "1536x1024";

export interface GeneratedImage {
  readonly id: string;
  readonly provider: ImageGenerationProviderName;
  readonly model: string;
  readonly format: GeneratedImageFormat;
  readonly size: GeneratedImageSize;
  readonly base64: string;
  readonly revisedPrompt?: string;
  readonly createdAt: string;
}

export interface PersistedGeneratedImage extends GeneratedImage {
  readonly artifact: ArtifactSnapshot;
  readonly downloadUrl: string;
  readonly sizeBytes: number;
}

export interface ImageGenerationRequest {
  readonly brief: ImageBrief & { readonly aiPrompt?: string; readonly negativePrompt?: string };
  readonly format?: GeneratedImageFormat;
  readonly size?: GeneratedImageSize;
  readonly quality?: "low" | "medium" | "high";
}

export interface ImageGenerationProvider {
  readonly name: ImageGenerationProviderName;
  generate(request: ImageGenerationRequest, signal?: AbortSignal): Promise<GeneratedImage>;
}

export interface CreateImageGenerationTaskInput {
  readonly brief: ImageGenerationRequest["brief"];
  readonly format?: GeneratedImageFormat;
  readonly size?: GeneratedImageSize;
  readonly quality?: "low" | "medium" | "high";
  readonly correlationId?: string;
}
