import assert from "node:assert/strict";
import test from "node:test";

import {
  detectCanonicalGiftInterests,
  enrichGiftProfileInterests,
} from "./gift-profile-interest-enricher.js";

test("cocinar converge en cooking", () => {
  assert.deepEqual(
    detectCanonicalGiftInterests(
      "Es para mi padre y le encanta cocinar.",
    ),
    ["cooking"],
  );
});

test("chef converge en cooking", () => {
  assert.deepEqual(
    detectCanonicalGiftInterests(
      "Es chef y disfruta preparando recetas.",
    ),
    ["cooking"],
  );
});

test("barbacoa converge en cooking", () => {
  assert.deepEqual(
    detectCanonicalGiftInterests(
      "Le encanta hacer barbacoas los domingos.",
    ),
    ["cooking"],
  );
});

test("fusiona los intereses previos sin duplicarlos", () => {
  const profile = enrichGiftProfileInterests(
    {
      interests: ["cocina", "football"],
      sourceMessage: "texto original",
    },
    "También le encanta hacer barbacoas.",
  );

  assert.deepEqual(
    profile.interests,
    ["cooking", "football"],
  );
});

test("no inventa intereses con frases genéricas", () => {
  assert.deepEqual(
    detectCanonicalGiftInterests(
      "Quiero hacerle un regalo muy bonito.",
    ),
    [],
  );
});
