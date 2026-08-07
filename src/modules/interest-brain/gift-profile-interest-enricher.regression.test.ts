import assert from "node:assert/strict";
import test from "node:test";

import {
  detectCanonicalGiftInterests,
} from "./gift-profile-interest-enricher.js";

const cases = [
  "Le encanta cocinar.",
  "Es chef.",
  "Le encanta hacer barbacoas.",
  "Disfruta preparando recetas.",
  "Le gusta la repostería.",
] as const;

for (const message of cases) {
  test(`${message} converge en cooking`, () => {
    assert.deepEqual(
      detectCanonicalGiftInterests(message),
      ["cooking"],
    );
  });
}

test("no crea cooking por una palabra contextual genérica", () => {
  assert.deepEqual(
    detectCanonicalGiftInterests(
      "Le gusta pasar tiempo fuera.",
    ),
    [],
  );
});

test("mantiene otros intereses canónicos", () => {
  assert.deepEqual(
    detectCanonicalGiftInterests(
      "Le gusta el fútbol y hacer barbacoas.",
    ),
    ["football", "cooking"],
  );
});
