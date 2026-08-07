import { JourneyProject } from "../journey-domain/index.js";
import type { DiscoveryExtraction } from "./discovery.types.js";

export function applyDiscovery(project: JourneyProject, extraction: DiscoveryExtraction): JourneyProject {
  let next = project.status === "DRAFT" ? project.transition("DISCOVERING") : project;
  const current = next.snapshot();

  for (const participant of extraction.participants) {
    const duplicate = current.participants.some((item) =>
      item.role === participant.role &&
      item.name === participant.name &&
      item.age === participant.age &&
      item.relationship === participant.relationship,
    );
    if (!duplicate) next = next.addParticipant(participant);
  }

  for (const fact of extraction.facts) next = next.setFact(fact);

  next = next.setFact({
    key: "discovery.last_extractor_version",
    value: extraction.extractorVersion,
    confidence: 1,
    source: "SYSTEM",
  });
  next = next.setFact({
    key: "discovery.last_confidence",
    value: extraction.confidence,
    confidence: 1,
    source: "SYSTEM",
  });
  return next;
}
