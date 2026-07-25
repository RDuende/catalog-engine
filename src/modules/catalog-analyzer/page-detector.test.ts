import assert from "node:assert/strict";
import test from "node:test";
import { analyzePage } from "./page-detector.js";

test("clasifica una página de producto", () => {
  const result = analyzePage(
    {
      page: 10,
      text: `
20411 Turam
Botella de acero inoxidable.
Medidas 7 x 25 cm
PRINT CODE: L2
50 100 250 500
8,40 7,90 7,50 7,10
BOX 50 PCS
`,
    },
    100,
  );

  assert.equal(result.kind, "PRODUCT");
  assert.ok(result.signals.references.includes("20411"));
  assert.ok(result.signals.dimensions.length > 0);
  assert.ok(result.signals.printCodes.length > 0);
});

test("clasifica una página de categoría", () => {
  const result = analyzePage(
    { page: 5, text: "BACKPACKS\nBAGS & TRAVEL" },
    100,
  );

  assert.equal(result.kind, "CATEGORY");
});
