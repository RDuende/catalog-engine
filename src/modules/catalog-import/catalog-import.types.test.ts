import assert from "node:assert/strict";
import test from "node:test";
import type { UnifiedCatalogImportRequest } from "./catalog-import.types.js";

test("el contrato permite configurar el pipeline completo", () => {
  const input: UnifiedCatalogImportRequest = {
    provider: "makito",
    config: { baseUrl: "https://apis.makito.es" },
    classifyProducts: true,
    importMedia: true,
    mediaConcurrency: 4,
    buildKnowledge: true,
  };
  assert.equal(input.provider, "makito");
  assert.equal(input.importMedia, true);
});
