import { DeterministicImageBriefBuilder } from "./deterministic-image-brief-builder.js";
import type { BuildImageBriefsInput, ImageBriefBuilderContract, ImageBriefSet } from "./image-brief.types.js";

export interface ImageBriefBuilderOptions {
  readonly builder?: ImageBriefBuilderContract;
}

export class ImageBriefBuilder {
  private readonly builder: ImageBriefBuilderContract;

  constructor(options: ImageBriefBuilderOptions = {}) {
    this.builder = options.builder ?? new DeterministicImageBriefBuilder();
  }

  build(input: BuildImageBriefsInput): ImageBriefSet {
    const { creativeBrief, storySet } = input;
    if (!creativeBrief.validation.valid || creativeBrief.status !== "READY") {
      throw new Error("Image Brief Builder necesita un CreativeBrief válido y READY.");
    }
    if (storySet.briefId !== creativeBrief.id || storySet.briefVersion !== creativeBrief.version) {
      throw new Error("StoryConceptSet y CreativeBrief no comparten la misma versión de origen.");
    }
    if (storySet.concepts.length === 0) {
      throw new Error("Image Brief Builder necesita al menos un StoryConcept.");
    }

    const now = input.now ?? new Date().toISOString();
    const briefs = Object.freeze(storySet.concepts.map((story, index) => this.builder.build(
      creativeBrief,
      story,
      { ...input, now },
      index,
    )));
    const version = input.setVersion ?? 1;

    return Object.freeze({
      id: `${storySet.id}:image-brief-set:${version}`,
      journeyId: creativeBrief.journeyId,
      journeyVersion: creativeBrief.journeyVersion,
      creativeBriefId: creativeBrief.id,
      creativeBriefVersion: creativeBrief.version,
      storySetId: storySet.id,
      storySetVersion: storySet.version,
      version,
      briefs,
      createdAt: now,
    });
  }
}
