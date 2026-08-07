import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultKnowledgeBrain,
} from "./knowledge-brain.service.js";

const negatives = [
  {
    text:
      "Power bank metálico con batería de 5000mAh y USB-C",
    absentInterest: "drums",
    material: "metal",
    feature: "battery",
  },
  {
    text:
      "Botella metálica de acero inoxidable",
    absentInterest: "heavy-metal",
    material: "metal",
  },
  {
    text:
      "Camiseta de manga corta",
    absentInterest: "manga",
    object: "shirt",
  },
  {
    text:
      "CAT TEXTIL 2025 IBERIA C/PRECIO",
    absentInterest: "cats",
  },
] as const;

for (const item of negatives) {
  test(`desambigua: ${item.text}`, () => {
    const profile =
      defaultKnowledgeBrain.analyze({
        text: item.text,
      });

    assert.equal(
      profile.interests.includes(
        item.absentInterest,
      ),
      false,
    );

    if ("material" in item) {
      assert.equal(
        profile.materials.includes(
          item.material,
        ),
        true,
      );
    }

    if ("feature" in item) {
      assert.equal(
        profile.features.includes(
          item.feature,
        ),
        true,
      );
    }

    if ("object" in item) {
      assert.equal(
        profile.objects.includes(
          item.object,
        ),
        true,
      );
    }
  });
}

test("conserva contextos positivos", () => {
  const drums =
    defaultKnowledgeBrain.analyze({
      text:
        "Set de batería musical con baquetas, platillos y bombo",
    });

  const metal =
    defaultKnowledgeBrain.analyze({
      text:
        "Fan del heavy metal, rock y Metallica",
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
    metal.interests.includes(
      "heavy-metal",
    ),
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
