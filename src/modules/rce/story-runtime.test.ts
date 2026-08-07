import assert from "node:assert/strict";
import test from "node:test";

import type {
  RceStoryGenerationPort,
} from "./story-runtime.contracts.js";
import { RceStoryRuntime } from "./story-runtime.js";
import { registerStoryRuntimeHandler } from "./story-runtime-adapter.js";
import { RceTaskRuntime } from "./task-runtime.js";
import { LegacyStoryEngineAdapter } from "./legacy-story-engine.adapter.js";

function planned(
  id: string,
  input: Readonly<Record<string, unknown>>,
) {
  return Object.freeze({
    id,
    type: "PREPARE_STORY_SEEDS" as const,
    status: "PLANNED" as const,
    priority: 70,
    reason: "test",
    input,
  });
}

const port: RceStoryGenerationPort = {
  async generate(criteria) {
    return [
      {
        id: "seed-1",
        title: "El gol que nunca se olvida",
        premise: `Una historia para ${criteria.relationship ?? "alguien especial"}.`,
        tone: "emotional",
        emotionalGoal: "celebrate_connection",
        personalizationIdeas: ["Nombre", "Fecha", "Mensaje"],
        score: 92,
        reasons: ["Relacionado con fútbol"],
      },
    ];
  },
};

test("PREPARE_STORY_SEEDS genera semillas narrativas", async () => {
  const tasks = new RceTaskRuntime();
  const stories = new RceStoryRuntime({ port });

  registerStoryRuntimeHandler(tasks, stories);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("story-1", {
        "recipient.relationship": "nephew",
        "recipient.interests": ["football"],
        "occasion.type": "birthday",
      }),
    ],
  });

  const result = await tasks.runNext("c1");
  const payload = result.tasks[0]?.result as {
    readonly result?: {
      readonly seeds?: readonly unknown[];
    };
  };

  assert.equal(result.tasks[0]?.status, "COMPLETED");
  assert.equal(payload.result?.seeds?.length, 1);
  assert.equal(stories.metrics().generations, 1);
});

test("reutiliza semillas con criterios idénticos", async () => {
  const tasks = new RceTaskRuntime();
  const stories = new RceStoryRuntime({ port });

  registerStoryRuntimeHandler(tasks, stories);

  const input = {
    "recipient.relationship": "nephew",
    "recipient.interests": ["football"],
    "occasion.type": "birthday",
  };

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("story-1", input)],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c2",
    tasks: [planned("story-2", input)],
  });
  await tasks.runNext("c2");

  assert.equal(stories.metrics().generations, 1);
  assert.equal(stories.metrics().cacheHits, 1);
});

test("cambiar intereses produce una nueva generación", async () => {
  const tasks = new RceTaskRuntime();
  const stories = new RceStoryRuntime({ port });

  registerStoryRuntimeHandler(tasks, stories);

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("story-1", {
        "recipient.interests": ["football"],
      }),
    ],
  });
  await tasks.runNext("c1");

  tasks.plan({
    conversationId: "c1",
    tasks: [
      planned("story-2", {
        "recipient.interests": ["marvel"],
      }),
    ],
  });
  await tasks.runNext("c1");

  assert.equal(stories.metrics().generations, 2);
});

test("un fallo del Story Port no rompe el runtime", async () => {
  const tasks = new RceTaskRuntime();
  const stories = new RceStoryRuntime({
    port: {
      async generate() {
        throw new Error("story provider unavailable");
      },
    },
  });

  registerStoryRuntimeHandler(tasks, stories);

  tasks.plan({
    conversationId: "c1",
    tasks: [planned("story-1", {})],
  });

  const result = await tasks.runNext("c1");

  assert.equal(result.tasks[0]?.status, "FAILED");
  assert.match(
    result.tasks[0]?.error ?? "",
    /story provider unavailable/,
  );
  assert.equal(stories.metrics().failures, 1);
});

test("el adaptador estructural convierte conceptos heredados", async () => {
  const adapter = new LegacyStoryEngineAdapter({
    async generate() {
      return {
        concepts: [
          {
            id: "concept-1",
            title: "Una aventura compartida",
            summary: "Historia de recuerdos y conexión.",
            tone: "warm",
            emotionalGoal: "connection",
            personalizationIdeas: ["Foto"],
          },
        ],
      };
    },
  });

  const seeds = await adapter.generate({
    relationship: "friend",
    interests: ["travel"],
    style: [],
    emotionalGoals: [],
    limit: 3,
  });

  assert.equal(seeds.length, 1);
  assert.equal(seeds[0]?.title, "Una aventura compartida");
  assert.equal(
    seeds[0]?.metadata?.["source"],
    "legacy-story-engine",
  );
});
