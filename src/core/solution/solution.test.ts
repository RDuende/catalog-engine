import assert from "node:assert/strict";
import test from "node:test";
import { SolutionEngine } from "./index.js";
import type { ParsedIntent } from "../intent/model.js";

test("resuelve soluciones desde una intención", () => {
  const engine = new SolutionEngine([
    { id: "teacher", name: "Regalo para profesor", recipients: ["profesor"], occasions: ["fin de curso"], emotions: ["agradecimiento"], priority: 2 },
    { id: "wedding", name: "Regalo de boda", occasions: ["boda"] },
  ]);
  const intent: ParsedIntent = {
    rawText: "regalo para profesor",
    normalizedText: "regalo para profesor",
    recipient: "profesor",
    occasion: "fin de curso",
    priority: "normal",
    attributes: { emotion: ["agradecimiento"] },
    terms: ["regalo"],
    confidence: 0.9,
    warnings: [],
  };
  const [first] = engine.resolve(intent);
  assert.equal(first?.definition.id, "teacher");
  // Desglose estable: destinatario 40 + ocasión 35 + emoción 10 + prioridad 2.
  assert.equal(first?.score, 87);
  assert.deepEqual(first?.reasons, [
    "Adecuada para profesor",
    "Adecuada para fin de curso",
    "Transmite agradecimiento",
  ]);
});
