import type { CreativeBrief } from "../creative-brief/index.js";
import { DeterministicStoryConceptProvider } from "./deterministic-story-provider.js";
import type {
  StoryConceptProvider,
  StoryConceptSet,
} from "./story-engine.types.js";

export interface StoryEngineOptions {
  readonly provider?: StoryConceptProvider;
}

export class StoryEngine {
  private readonly provider: StoryConceptProvider;

  constructor(options: StoryEngineOptions = {}) {
    this.provider = options.provider ?? new DeterministicStoryConceptProvider();
  }

  async generate(
    brief: CreativeBrief,
    options: { readonly count?: number; readonly setVersion?: number; readonly now?: string } = {},
  ): Promise<StoryConceptSet> {
    if (!brief.validation.valid || brief.status !== "READY") {
      throw new Error("El Story Engine necesita un CreativeBrief válido y READY.");
    }

    const now = options.now ?? new Date().toISOString();
    const concepts = await this.provider.generate({ brief, count: options.count ?? 3, now });

    if (concepts.length === 0) {
      throw new Error(`El proveedor ${this.provider.id} no generó conceptos narrativos.`);
    }

    return Object.freeze({
      id: `${brief.id}:story-set:${options.setVersion ?? 1}`,
      journeyId: brief.journeyId,
      journeyVersion: brief.journeyVersion,
      briefId: brief.id,
      briefVersion: brief.version,
      version: options.setVersion ?? 1,
      concepts: Object.freeze([...concepts]),
      createdAt: now,
    });
  }
}
