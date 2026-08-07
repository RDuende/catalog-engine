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

test("la etapa de catálogo expone diagnóstico completo", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "ai-intelligence-diagnostics-"),
  );

  try {
    const service = new AiIntelligenceService(
      new SmartCatalogService(
        new InMemorySmartCatalogRepository(),
      ),
      join(directory, "traces.json"),
    );

    const trace = await service.run({
      message:
        "Un regalo de cumpleaños para alguien que juega al fútbol",
      limit: 12,
    });

    const stage = trace.stages.find(
      (item) => item.id === "catalog",
    );
    const output = stage?.output as
      | {
          readonly catalogSize?: number;
          readonly scopedCount?: number;
          readonly selectedCount?: number;
          readonly discarded?: readonly unknown[];
        }
      | undefined;

    assert.equal(typeof output?.catalogSize, "number");
    assert.equal(typeof output?.scopedCount, "number");
    assert.equal(
      output?.selectedCount,
      trace.recommendations.length,
    );
    assert.equal(Array.isArray(output?.discarded), true);
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    });
  }
});
