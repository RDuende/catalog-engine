import assert from "node:assert/strict";
import test from "node:test";
import { MockAIProvider } from "../ai-gateway/index.js";
import { AIProviderFactory } from "./ai-provider.factory.js";
import { AIImagePromptEnhancer } from "./ai-image-prompt-enhancer.js";

const imageSet = {
  id: "set-1", journeyId: "j-1", journeyVersion: 1, creativeBriefId: "b-1",
  creativeBriefVersion: 1, storySetId: "s-1", storySetVersion: 1, version: 1,
  createdAt: "2026-08-02T00:00:00.000Z",
  briefs: [{
    id: "ib-1", version: 1, status: "READY", journeyId: "j-1", journeyVersion: 1,
    creativeBriefId: "b-1", creativeBriefVersion: 1, storyConceptId: "story-1",
    storyConceptVersion: 1, purpose: "CONCEPT", title: "Dirección visual", scene: "Escena",
    emotionalIntent: "Alegría", visualStyle: "COMIC", aspectRatio: "1:1", subjects: [],
    composition: { framing: "SCENE", camera: "EYE_LEVEL", focalPoint: "gemelas", foreground: [], background: [], balance: "DYNAMIC" },
    palette: { mood: "alegre", colors: ["violeta"], contrast: "HIGH" }, requiredElements: ["dos protagonistas"],
    forbiddenElements: ["texto"], textPolicy: "NO_TEXT", productionNotes: [], promptSeed: "prompt base",
    builderId: "deterministic", builderVersion: "v1", createdAt: "2026-08-02T00:00:00.000Z",
  }],
} as const;

test("factory conserva deterministic como ausencia de proveedor externo", () => {
  assert.equal(AIProviderFactory.create({ provider: "deterministic" }), undefined);
  assert.equal(AIProviderFactory.create({ provider: "mock" })?.name, "mock");
});

test("mejora prompts con proveedor intercambiable", async () => {
  const provider = new MockAIProvider(() => ({ prompt: "prompt enriquecido", negativePrompt: "sin texto" }));
  const result = await new AIImagePromptEnhancer(provider).enhance(imageSet);
  assert.equal(result.briefs[0]?.aiPrompt, "prompt enriquecido");
  assert.equal(result.briefs[0]?.promptProvider, "mock");
});
