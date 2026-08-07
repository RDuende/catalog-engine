import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { InMemoryArtifactRepository } from "../artifact-domain/index.js";
import { ArtifactService } from "../artifact-service/index.js";
import { LocalArtifactStorage } from "../artifact-storage/index.js";
import { InMemoryTaskManager } from "../task-manager/index.js";
import { ImageGenerationService } from "./image-generation.service.js";
import { MockImageGenerationProvider } from "./mock-image-generation.provider.js";

const brief = {
  id: "brief-artifact-1", version: 1, status: "READY", journeyId: "journey-artifact-1", journeyVersion: 1,
  creativeBriefId: "creative-1", creativeBriefVersion: 1, storyConceptId: "story-1", storyConceptVersion: 1,
  purpose: "CONCEPT", title: "Gemelas heroínas", scene: "Dos gemelas unen sus emblemas", emotionalIntent: "complicidad",
  visualStyle: "COMIC", aspectRatio: "1:1", subjects: [],
  composition: { framing: "GROUP", camera: "EYE_LEVEL", focalPoint: "emblema", foreground: [], background: [], balance: "SYMMETRIC" },
  palette: { mood: "alegre", colors: ["violeta", "turquesa"], contrast: "HIGH" }, requiredElements: ["dos protagonistas"],
  forbiddenElements: ["texto"], textPolicy: "NO_TEXT", productionNotes: [], promptSeed: "Dos gemelas superheroínas",
  builderId: "test", builderVersion: "1", createdAt: new Date().toISOString(),
} as const;

test("guarda automáticamente la imagen generada como artefacto del Journey", async () => {
  const rootDirectory = await mkdtemp(join(tmpdir(), "rai-image-artifact-"));
  try {
    const repository = new InMemoryArtifactRepository();
    const artifactService = new ArtifactService(repository, new LocalArtifactStorage({ rootDirectory }));
    const manager = new InMemoryTaskManager();
    const service = new ImageGenerationService(manager, new MockImageGenerationProvider(), artifactService);

    const task = service.createTask({ brief });
    await new Promise((resolve) => setTimeout(resolve, 30));

    const completed = manager.get(task.id);
    assert.equal(completed.state, "COMPLETED");
    const result = completed.result as {
      artifact: { id: string; journeyId: string; type: string; version: number };
      downloadUrl: string;
      sizeBytes: number;
    };
    assert.equal(result.artifact.journeyId, brief.journeyId);
    assert.equal(result.artifact.type, "IMAGE");
    assert.equal(result.artifact.version, 1);
    assert.match(result.downloadUrl, /\/api\/v1\/artifacts\/.+\/content/);
    assert.equal(result.sizeBytes > 0, true);

    const stored = await artifactService.listByJourney(brief.journeyId, "IMAGE");
    assert.equal(stored.length, 1);
    assert.equal(stored[0]?.id, result.artifact.id);
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});
