import { JourneyProject } from "../journey-domain/index.js";
import type { CreativeBrief } from "../creative-brief/index.js";
import type { StoryConceptSet } from "../story-engine/index.js";
import type { ImageBriefSet } from "../image-brief/index.js";
import { SolutionEngine } from "./solution-engine.js";
import type { SolutionSet } from "./solution-engine.types.js";

export interface ApplySolutionsResult {
  readonly journey: JourneyProject;
  readonly solutionSet: SolutionSet;
}

export function applySolutions(
  project: JourneyProject,
  creativeBrief: CreativeBrief,
  storySet: StoryConceptSet,
  imageBriefSet: ImageBriefSet,
  engine: SolutionEngine = new SolutionEngine(),
  now?: string,
): ApplySolutionsResult {
  const current = project.snapshot();
  const version = current.artifacts.filter((artifact) => artifact.type === "PROPOSAL").reduce((max, artifact) => Math.max(max, artifact.version), 0) + 1;
  const solutionSet = engine.build({ creativeBrief, storySet, imageBriefSet, setVersion: version, now });
  const proposing = project.status === "INSPIRING" ? project.transition("PROPOSING", now) : project;
  const journey = proposing.addArtifact({
    type: "PROPOSAL",
    status: "READY",
    title: `Solution Set v${version}`,
    data: { solutionSet },
    now,
  });
  return Object.freeze({ journey, solutionSet });
}
