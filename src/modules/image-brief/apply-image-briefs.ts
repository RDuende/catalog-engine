import { JourneyProject } from "../journey-domain/index.js";
import type { CreativeBrief } from "../creative-brief/index.js";
import type { StoryConceptSet } from "../story-engine/index.js";
import { ImageBriefBuilder } from "./image-brief-builder.js";
import type { ImageBriefSet } from "./image-brief.types.js";

export interface ApplyImageBriefsResult {
  readonly journey: JourneyProject;
  readonly imageBriefSet: ImageBriefSet;
}

export function applyImageBriefs(
  project: JourneyProject,
  creativeBrief: CreativeBrief,
  storySet: StoryConceptSet,
  builder: ImageBriefBuilder = new ImageBriefBuilder(),
  now?: string,
): ApplyImageBriefsResult {
  const current = project.snapshot();
  const version = current.artifacts
    .filter((artifact) => artifact.type === "IMAGE" && artifact.title?.startsWith("Image Briefs"))
    .reduce((max, artifact) => Math.max(max, artifact.version), 0) + 1;
  const imageBriefSet = builder.build({ creativeBrief, storySet, setVersion: version, now });
  const journey = project.addArtifact({
    type: "IMAGE",
    status: "READY",
    title: `Image Briefs v${version}`,
    data: { imageBriefSet },
    now,
  });
  return Object.freeze({ journey, imageBriefSet });
}
