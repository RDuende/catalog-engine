import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultKnowledgeBrain,
} from "./knowledge-brain.service.js";

test("power bank metálico se clasifica sin drums", () => {
  const profile =
    defaultKnowledgeBrain.analyze({
      text:
        "Power bank metálico con batería de 5000mAh y USB-C",
    });

  assert.equal(
    profile.features.includes("battery"),
    true,
  );
  assert.equal(
    profile.features.includes("usb"),
    true,
  );
  assert.equal(
    profile.materials.includes("metal"),
    true,
  );
  assert.equal(
    profile.interests.includes("drums"),
    false,
  );
});

test("metal de producto no reaparece como heavy metal", () => {
  const profile =
    defaultKnowledgeBrain.analyze({
      text:
        "Botella metálica de acero inoxidable",
    });

  assert.equal(
    profile.materials.includes("metal"),
    true,
  );
  assert.equal(
    profile.interests.includes(
      "heavy-metal",
    ),
    false,
  );
});

test("manga corta bloquea el fallback manga", () => {
  const profile =
    defaultKnowledgeBrain.analyze({
      text:
        "Camiseta de manga corta",
    });

  assert.equal(
    profile.interests.includes("manga"),
    false,
  );
  assert.equal(
    profile.objects.includes("shirt"),
    true,
  );
});

test("CAT TEXTIL bloquea el fallback cats", () => {
  const profile =
    defaultKnowledgeBrain.analyze({
      text:
        "CAT TEXTIL 2025 IBERIA C/PRECIO",
    });

  assert.equal(
    profile.interests.includes("cats"),
    false,
  );
});

test("los contextos positivos siguen funcionando", () => {
  const drums =
    defaultKnowledgeBrain.analyze({
      text:
        "Set de batería musical con baquetas y platillos",
    });

  const manga =
    defaultKnowledgeBrain.analyze({
      text:
        "Fan del manga japonés, anime y Naruto",
    });

  const cats =
    defaultKnowledgeBrain.analyze({
      text:
        "Taza para una cat lover con huella de gato",
    });

  assert.equal(
    drums.interests.includes("drums"),
    true,
  );
  assert.equal(
    manga.interests.includes("manga"),
    true,
  );
  assert.equal(
    cats.interests.includes("cats"),
    true,
  );
});
