import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCatalog } from "./catalog-analyzer.js";

test("genera diagnósticos de referencias duplicadas y páginas desconocidas", () => {
  const report = analyzeCatalog({
    sourceFile: "makito.json",
    sourceHash: "hash",
    startedAt: Date.now(),
    pages: [
      { page: 1, text: "20411 Turam\nMedidas 7 x 25 cm\n8,40 7,90" },
      { page: 2, text: "20411 Turam\nMedidas 7 x 25 cm\n8,40 7,90" },
      { page: 3, text: "texto sin señales suficientes" },
    ],
  });

  assert.deepEqual(report.diagnostics.duplicateReferences, [
    { reference: "20411", pages: [1, 2] },
  ]);
  assert.deepEqual(report.diagnostics.unknownPages, [3]);
});
