import assert from "node:assert/strict";
import test from "node:test";
import { providerSyncPipeline } from "../core-sync/provider-sync-pipeline.js";

test("el importador unificado ejecuta todas las fases en orden", () => {
  assert.deepEqual(providerSyncPipeline.stages.map(stage => stage.name), [
    "initialize",
    "download-and-normalize",
    "save-snapshot",
    "canonical-import",
    "product-brain-classification",
    "local-media-sync",
    "knowledge-graph-build",
    "report",
  ]);
});

test("clasificación e imágenes se ejecutan después del catálogo canónico", () => {
  const names = providerSyncPipeline.stages.map(stage => stage.name);
  assert.ok(names.indexOf("product-brain-classification") > names.indexOf("canonical-import"));
  assert.ok(names.indexOf("local-media-sync") > names.indexOf("product-brain-classification"));
});
