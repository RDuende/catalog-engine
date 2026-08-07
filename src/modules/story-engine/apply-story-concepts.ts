import { JourneyProject } from "../journey-domain/index.js";
import type { CreativeBrief } from "../creative-brief/index.js";
import { StoryEngine } from "./story-engine.js";
import type { StoryConceptSet } from "./story-engine.types.js";

export interface ApplyStoryConceptsResult {
  readonly journey: JourneyProject;
  readonly storySet: StoryConceptSet;
}

export async function applyStoryConcepts(
  project: JourneyProject,
  brief: CreativeBrief,
  engine: StoryEngine = new StoryEngine(),
  now?: string,
): Promise<ApplyStoryConceptsResult> {
  const current = project.snapshot();
  const version = current.artifacts
    .filter((artifact) => artifact.type === "STORY")
    .reduce((max, artifact) => Math.max(max, artifact.version), 0) + 1;

  const storySet = await engine.generate(brief, { count: 3, setVersion: version, now });
  const inspiring = project.status === "READY_FOR_INSPIRATION"
    ? project.transition("INSPIRING", now)
    : project;
  const journey = inspiring.addArtifact({
    type: "STORY",
    status: "READY",
    title: `Story Concepts v${storySet.version}`,
    data: { storySet },
    now,
  });

  return Object.freeze({ journey, storySet });
}
