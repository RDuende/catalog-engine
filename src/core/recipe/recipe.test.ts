import assert from "node:assert/strict";
import test from "node:test";
import { RecipeEngine } from "./index.js";

test("crea un plan de producción ordenado", () => {
  const engine = new RecipeEngine([{
    id: "r1", productId: "p1", version: 1, name: "Taza sublimada", active: true, materials: [],
    operations: [
      { id: "o2", order: 2, name: "Prensado", estimatedMinutes: 4 },
      { id: "o1", order: 1, name: "Impresión", estimatedMinutes: 3 },
    ],
  }]);
  const plan = engine.build("p1");
  assert.equal(plan?.totalEstimatedMinutes, 7);
  assert.deepEqual(plan?.orderedOperations.map((operation) => operation.id), ["o1", "o2"]);
});
