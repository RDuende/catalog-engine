import assert from "node:assert/strict";
import test from "node:test";
import { mergeCommercialContext } from "./context-merger.js";

 test("aplica parches válidos y conserva valores existentes", () => {
  const result = mergeCommercialContext(
    { need: "regalo corporativo", campaign: "navidad" },
    [
      { field: "quantity", operation: "SET", value: "500", confidence: 0.98 },
      { field: "budget", operation: "SET", value: "5,50", confidence: 0.9 },
    ],
  );
  assert.equal(result.context.need, "regalo corporativo");
  assert.equal(result.context.quantity, 500);
  assert.equal(result.context.budget, 5.5);
  assert.equal(result.context.currency, "EUR");
  assert.equal(result.context.confidence?.quantity, 0.98);
  assert.equal(result.rejected.length, 0);
});

 test("rechaza valores incompatibles sin corromper el contexto", () => {
  const result = mergeCommercialContext(
    { quantity: 100, sustainability: true },
    [
      { field: "quantity", operation: "SET", value: "12.5" },
      { field: "customizable", operation: "SET", value: "sí" },
    ],
  );
  assert.equal(result.context.quantity, 100);
  assert.equal(result.context.sustainability, true);
  assert.equal(result.context.customizable, undefined);
  assert.equal(result.rejected.length, 2);
});

 test("permite eliminar campos y su confianza", () => {
  const result = mergeCommercialContext(
    { budget: 5, confidence: { budget: 1 } },
    [{ field: "budget", operation: "UNSET", value: null }],
  );
  assert.equal(result.context.budget, undefined);
  assert.equal(result.context.confidence?.budget, undefined);
});
