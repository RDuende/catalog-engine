import type { ArtifactService } from "../artifact-service/index.js";
import type { InMemoryTaskManager, ManagedTask } from "../task-manager/index.js";
import { createImageGenerationProvider } from "./image-generation.factory.js";
import type {
  CreateImageGenerationTaskInput,
  GeneratedImage,
  GeneratedImageFormat,
  ImageGenerationProvider,
  PersistedGeneratedImage,
} from "./image-generation.types.js";

const MIME_TYPES: Readonly<Record<GeneratedImageFormat, string>> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const EXTENSIONS: Readonly<Record<GeneratedImageFormat, string>> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

export class ImageGenerationService {
  constructor(
    private readonly taskManager: InMemoryTaskManager,
    private readonly provider: ImageGenerationProvider = createImageGenerationProvider(),
    private readonly artifactService?: ArtifactService,
  ) {}

  createTask(
    input: CreateImageGenerationTaskInput,
  ): ManagedTask<CreateImageGenerationTaskInput, GeneratedImage | PersistedGeneratedImage> {
    return this.taskManager.createAndEnqueue<
      CreateImageGenerationTaskInput,
      GeneratedImage | PersistedGeneratedImage
    >({
      type: "IMAGE_GENERATION",
      capabilityId: "image.generate",
      correlationId: input.correlationId,
      input,
      maxAttempts: 2,
      cancellable: true,
      executor: async (taskInput, context) => {
        context.progress({ percent: 10, step: "PREPARE_PROMPT", message: "Preparando la dirección visual" });
        context.progress({ percent: 30, step: "GENERATE_IMAGE", message: "Creando la imagen" });

        const image = await this.provider.generate({
          brief: taskInput.brief,
          format: taskInput.format,
          size: taskInput.size,
          quality: taskInput.quality,
        }, context.signal);

        if (!this.artifactService) {
          context.progress({ percent: 90, step: "FINALIZE", message: "Terminando y preparando el resultado" });
          return image;
        }

        context.progress({ percent: 80, step: "STORE_ARTIFACT", message: "Guardando la imagen en el proyecto" });
        const content = Buffer.from(image.base64, "base64");
        if (content.byteLength === 0) {
          throw new Error("El proveedor devolvió una imagen vacía.");
        }

        const stored = await this.artifactService.create({
          journeyId: taskInput.brief.journeyId,
          type: "IMAGE",
          fileName: `${taskInput.brief.id}.${EXTENSIONS[image.format]}`,
          content,
          title: taskInput.brief.title,
          mimeType: MIME_TYPES[image.format],
          provider: {
            provider: image.provider,
            model: image.model,
            externalId: image.id,
          },
          metadata: {
            "image.briefId": taskInput.brief.id,
            "image.briefVersion": taskInput.brief.version,
            "image.storyConceptId": taskInput.brief.storyConceptId,
            "image.creativeBriefId": taskInput.brief.creativeBriefId,
            "image.format": image.format,
            "image.size": image.size,
            "image.revisedPrompt": image.revisedPrompt ?? null,
            "image.generatedAt": image.createdAt,
          },
        });

        context.progress({ percent: 95, step: "FINALIZE", message: "Terminando y preparando el resultado" });
        return {
          ...image,
          artifact: stored.artifact,
          downloadUrl: stored.downloadUrl,
          sizeBytes: stored.sizeBytes,
        };
      },
    });
  }
}
