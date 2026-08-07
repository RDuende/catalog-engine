import assert from "node:assert/strict";
import test from "node:test";
import { extractFacts } from "./fact-extractor.js";

function operation(text: string) {
  return extractFacts({
    messageId: "m1",
    text,
    kind: "INFORMATION",
  }).find((fact) => fact.key === "recipient.interests")?.operation;
}

test("el extractor detecta negaciones pospuestas sin depender del clasificador", () => {
  assert.equal(operation("Pokémon no"), "REMOVE");
  assert.equal(operation("Marvel tampoco"), "REMOVE");
  assert.equal(operation("Le gusta Pokémon"), "ADD");
});
