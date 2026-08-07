import { JourneyProject, type JourneyArtifact } from "../journey-domain/index.js";
import { CreativeBriefBuilder } from "./creative-brief-builder.js";
import type { ApplyCreativeBriefOptions, CreativeBrief } from "./creative-brief.types.js";

export interface ApplyCreativeBriefResult { readonly journey: JourneyProject; readonly brief: CreativeBrief; readonly reused: boolean; }
function briefFromArtifact(artifact: JourneyArtifact): CreativeBrief | undefined {
  const value = artifact.data.brief;
  return value && typeof value === "object" ? value as CreativeBrief : undefined;
}
export function applyCreativeBrief(project: JourneyProject, builder: CreativeBriefBuilder = new CreativeBriefBuilder(), now?: string, options: ApplyCreativeBriefOptions = {}): ApplyCreativeBriefResult {
  const candidate = builder.build({ journey: project.snapshot(), now });
  const prior = [...project.snapshot().artifacts].filter((a) => a.type === "CREATIVE_BRIEF").sort((a, b) => b.version - a.version)
    .map(briefFromArtifact).find((brief) => brief?.fingerprint === candidate.fingerprint && brief.status === "READY");
  if (prior && !options.force) return Object.freeze({ journey: project, brief: prior, reused: true });
  const journey = project.addArtifact({ type: "CREATIVE_BRIEF", status: candidate.status === "READY" ? "READY" : "DRAFT", title: `Creative Brief v${candidate.version}`, data: { brief: candidate, fingerprint: candidate.fingerprint, qualityGate: candidate.qualityGate }, now });
  return Object.freeze({ journey, brief: candidate, reused: false });
}
