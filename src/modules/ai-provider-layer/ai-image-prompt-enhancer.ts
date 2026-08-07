import type { AIProvider } from "../ai-gateway/index.js";
import type { ImageBrief, ImageBriefSet } from "../image-brief/index.js";

interface EnhancedPromptResponse {
  readonly prompt: string;
  readonly negativePrompt: string;
}

const IMAGE_PROMPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["prompt", "negativePrompt"],
  properties: {
    prompt: { type: "string" },
    negativePrompt: { type: "string" },
  },
} as const;

export interface AIEnhancedImageBrief extends ImageBrief {
  readonly aiPrompt: string;
  readonly negativePrompt: string;
  readonly promptProvider: string;
}

export interface AIEnhancedImageBriefSet extends Omit<ImageBriefSet, "briefs"> {
  readonly briefs: readonly AIEnhancedImageBrief[];
}

export class AIImagePromptEnhancer {
  constructor(private readonly provider: AIProvider) {}

  async enhance(set: ImageBriefSet): Promise<AIEnhancedImageBriefSet> {
    const briefs = await Promise.all(set.briefs.map((brief) => this.enhanceBrief(brief)));
    return Object.freeze({ ...set, briefs: Object.freeze(briefs) });
  }

  private async enhanceBrief(brief: ImageBrief): Promise<AIEnhancedImageBrief> {
    const fallback: EnhancedPromptResponse = {
      prompt: brief.promptSeed,
      negativePrompt: brief.forbiddenElements.join(", "),
    };
    let enhanced = fallback;
    let promptProvider = "deterministic-fallback";
    try {
      const result = await this.provider.structured<EnhancedPromptResponse>({
        skill: "image.enhance-prompt",
        system: [
          "Convierte el brief visual en un prompt preciso para generación de imagen.",
          "Conserva todos los elementos obligatorios, respeta los prohibidos y no añadas texto a la imagen.",
          "No uses nombres de artistas vivos, marcas ni personajes protegidos.",
        ].join(" "),
        input: JSON.stringify(brief),
        schemaName: "image_prompt",
        schema: IMAGE_PROMPT_SCHEMA,
        fallback,
      });
      enhanced = result.data;
      promptProvider = this.provider.name;
    } catch {
      // La creación visual continúa con el prompt determinista si el proveedor falla.
    }
    return Object.freeze({
      ...brief,
      aiPrompt: enhanced.prompt,
      negativePrompt: enhanced.negativePrompt,
      promptProvider,
    });
  }
}
