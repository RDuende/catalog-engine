import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  InMemorySmartCatalogRepository,
  SmartCatalogService,
} from "../smart-catalog/index.js";
import { AiIntelligenceService } from "./ai-intelligence.service.js";

async function run(message: string) {
  const directory = await mkdtemp(
    join(tmpdir(), "ai-lab-interest-brain-"),
  );

  const service = new AiIntelligenceService(
    new SmartCatalogService(
      new InMemorySmartCatalogRepository(),
    ),
    join(directory, "traces.json"),
  );

  try {
    return await service.run({
      message,
      limit: 12,
    });
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    });
  }
}

for (const message of [
  "Es para mi padre, le encanta cocinar.",
  "Es para mi padre, es chef.",
  "Es para mi padre, le encanta hacer barbacoas.",
] as const) {
  test(`${message} produce cooking en el Gift Profile`, async () => {
    const trace = await run(message);

    assert.deepEqual(
      trace.giftProfile.interests,
      ["cooking"],
    );

    const query = trace.stages.find(
      (stage) => stage.id === "query",
    );

    assert.deepEqual(
      (
        query?.output as {
          readonly interests?: readonly string[];
        }
      )?.interests,
      ["cooking"],
    );
  });
}
