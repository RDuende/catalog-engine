import assert from "node:assert/strict";
import test from "node:test";

import type {
  RceImagePreparationPort,
} from "./image-runtime.contracts.js";
import { RceImageRuntime } from "./image-runtime.js";
import { registerImageRuntimeHandler } from "./image-runtime-adapter.js";
import { LegacyImageBriefAdapter } from "./legacy-image-brief.adapter.js";
import { RceTaskRuntime } from "./task-runtime.js";

function planned(
  id: string,
  input: Readonly<Record<string, unknown>>,
) {
  return Object.freeze({
    id,
    type: "PREPARE_PROPOSALS" as const,
    status: "PLANNED" as const,
    priority: 100,
    reason: "test",
    input,
  });
}

const port: RceImagePreparationPort = {
  async prepare(criteria) {
    return [
      {
        id: "variant-1",
        title: "Fútbol emotivo",
        prompt: `Regalo visual para ${criteria.relationship ?? "alguien especial"}`,
        negativePrompt: "texto ilegible",
        aspectRatio: "1:1",
        composition: "producto centrado",
        productId: criteria.productIds[0],
        storySeedId: criteria.storySeedIds[0],
        score: 90,
        reasons: ["Compatible con el contexto"],
      },
    ];
  },
};

test("PREPARE_PROPOSALS prepara variantes visuales", async () => {
  const tasks = new RceTaskRuntime();
  const images = new RceImageRuntime({ port });

  registerImageRuntimeHandler(tasks, images);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("image-1", {
        "recipient.relationship": "nephew",
        "recipient.interests": ["football"],
        "product.ids": ["ball"],
        "story.seed_ids": ["seed-1"],
      }),
    ],
  });

  const result = await tasks.runNext("c1");
  const payload = result.tasks[0]?.result as {
    readonly result?: {
      readonly variants?: readonly unknown[];
    };
  };

  assert.equal(result.tasks[0]?.status, "COMPLETED");
  assert.equal(payload.result?.variants?.length, 1);
  assert.equal(images.metrics().preparations, 1);
});

test("reutiliza variantes con criterios idénticos", async () => {
  const tasks = new RceTaskRuntime();
  const images = new RceImageRuntime({ port });

  registerImageRuntimeHandler(tasks, images);

  const input = {
    "recipient.interests": ["football"],
    "product.ids": ["ball"],
    "story.seed_ids": ["seed-1"],
  };

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("image-1", input)],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c2",
    tasks: [planned("image-2", input)],
  });
  await tasks.runNext("c2");

  assert.equal(images.metrics().preparations, 1);
  assert.equal(images.metrics().cacheHits, 1);
});

test("cambiar producto genera nuevas variantes", async () => {
  const tasks = new RceTaskRuntime();
  const images = new RceImageRuntime({ port });

  registerImageRuntimeHandler(tasks, images);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("image-1", {
        "product.ids": ["ball"],
      }),
    ],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("image-2", {
        "product.ids": ["shirt"],
      }),
    ],
  });
  await tasks.runNext("c1");

  assert.equal(images.metrics().preparations, 2);
});

test("un fallo del puerto no rompe el runtime", async () => {
  const tasks = new RceTaskRuntime();
  const images = new RceImageRuntime({
    port: {
      async prepare() {
        throw new Error("image provider unavailable");
      },
    },
  });

  registerImageRuntimeHandler(tasks, images);

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("image-1", {})],
  });

  const result = await tasks.runNext("c1");

  assert.equal(result.tasks[0]?.status, "FAILED");
  assert.match(
    result.tasks[0]?.error ?? "",
    /image provider unavailable/,
  );
  assert.equal(images.metrics().failures, 1);
});

test("el adaptador convierte briefs heredados", async () => {
  const adapter = new LegacyImageBriefAdapter({
    async build() {
      return {
        briefs: [
          {
            id: "brief-1",
            title: "Composición cálida",
            prompt: "Una escena familiar y emotiva",
            aspectRatio: "4:5",
            composition: "retrato vertical",
            productId: "canvas",
            storyConceptId: "story-1",
          },
        ],
      };
    },
  });

  const variants = await adapter.prepare({
    interests: [],
    style: [],
    emotionalGoals: [],
    productIds: ["canvas"],
    storySeedIds: ["story-1"],
    personalization: {},
    variantCount: 3,
  });

  assert.equal(variants.length, 1);
  assert.equal(variants[0]?.productId, "canvas");
  assert.equal(
    variants[0]?.metadata?.["source"],
    "legacy-image-brief-builder",
  );
});
