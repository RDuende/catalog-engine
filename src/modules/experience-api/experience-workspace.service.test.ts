import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ArtifactService } from "../artifact-service/index.js";
import { InMemoryArtifactRepository } from "../artifact-domain/index.js";
import { LocalArtifactStorage } from "../artifact-storage/index.js";
import { JourneyProject } from "../journey-domain/index.js";
import { createOwner, InMemoryMvpConversationRepository } from "../mvp-orchestrator/index.js";
import { ExperienceWorkspaceService } from "./experience-workspace.service.js";

test("persiste y recupera versiones del workspace mediante ArtifactService", async () => {
  const directory = await mkdtemp(join(tmpdir(), "experience-workspace-"));
  try {
    const conversations = new InMemoryMvpConversationRepository();
    const { owner } = createOwner({ kind: "USER", id: "user-1" });
    const journey = JourneyProject.create({ id: "journey-workspace", type: "GIFT", sessionId: "session-workspace" }).snapshot();
    conversations.save({ sessionId: "session-workspace", journey, owner, messages: [] });
    const artifacts = new ArtifactService(new InMemoryArtifactRepository(), new LocalArtifactStorage({ rootDirectory: directory }));
    const service = new ExperienceWorkspaceService(conversations, artifacts);

    await service.save(journey.id, "PERSONALIZATION", {
      proposalId: "proposal-1",
      payload: { name: "Lucía", dedication: "Siempre juntas" },
    }, { kind: "USER", id: "user-1" });

    const second = await service.save(journey.id, "PERSONALIZATION", {
      proposalId: "proposal-1",
      payload: { name: "Lucía", dedication: "Siempre, siempre juntas" },
    }, { kind: "USER", id: "user-1" });

    assert.equal(second.personalization?.version, 2);
    assert.equal(second.history.length, 2);
    assert.deepEqual(second.personalization?.payload, { name: "Lucía", dedication: "Siempre, siempre juntas" });
    const restored = conversations.findByJourney(journey.id);
    assert.equal(restored?.journey.facts.some((fact) => fact.key === "workspace.personalization.artifact_version" && fact.value === 2), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
