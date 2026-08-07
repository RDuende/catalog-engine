import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryTaskManager } from "../task-manager/index.js";
import { ImageGenerationService } from "./image-generation.service.js";
import { MockImageGenerationProvider } from "./mock-image-generation.provider.js";

const brief = {
  id: "brief-1", version: 1, status: "READY", journeyId: "journey-1", journeyVersion: 1,
  creativeBriefId: "creative-1", creativeBriefVersion: 1, storyConceptId: "story-1", storyConceptVersion: 1,
  purpose: "CONCEPT", title: "Gemelas heroínas", scene: "Dos gemelas unen sus emblemas", emotionalIntent: "complicidad",
  visualStyle: "COMIC", aspectRatio: "1:1", subjects: [],
  composition: { framing: "GROUP", camera: "EYE_LEVEL", focalPoint: "emblema", foreground: [], background: [], balance: "SYMMETRIC" },
  palette: { mood: "alegre", colors: ["violeta", "turquesa"], contrast: "HIGH" }, requiredElements: ["dos protagonistas"],
  forbiddenElements: ["texto"], textPolicy: "NO_TEXT", productionNotes: [], promptSeed: "Dos gemelas superheroínas",
  builderId: "test", builderVersion: "1", createdAt: new Date().toISOString(),
} as const;

test("crea una tarea de imagen y publica progreso hasta completarla", async () => {
  const manager = new InMemoryTaskManager();
  const service = new ImageGenerationService(manager, new MockImageGenerationProvider());
  const task = service.createTask({ brief });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const completed = manager.get(task.id);
  assert.equal(completed.state, "COMPLETED");
  assert.equal((completed.result as { provider: string }).provider, "mock");
  assert.equal(manager.events(task.id).some((event) => event.type === "TASK_PROGRESS"), true);
});
