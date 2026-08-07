import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultKnowledgeBrain,
} from "./knowledge-brain.service.js";

test("cat lover es cats, CAT TEXTIL no", () => {
  const positive =
    defaultKnowledgeBrain.analyze({
      text:
        "Taza para cat lover con huella de gato",
    });

  const negative =
    defaultKnowledgeBrain.analyze({
      text:
        "CAT TEXTIL 2025 IBERIA C/PRECIO",
    });

  assert.equal(
    positive.interests.includes("cats"),
    true,
  );
  assert.equal(
    negative.interests.includes("cats"),
    false,
  );
});

test("ambigüedades negativas y positivas", () => {
  const battery =
    defaultKnowledgeBrain.analyze({
      text:
        "Power bank metálico con batería 5000mAh y USB",
    });
  const drums =
    defaultKnowledgeBrain.analyze({
      text:
        "Set de batería musical con baquetas y platillos",
    });
  const sleeve =
    defaultKnowledgeBrain.analyze({
      text:
        "Camiseta de manga corta",
    });
  const manga =
    defaultKnowledgeBrain.analyze({
      text:
        "Manga japonés, anime y Naruto",
    });

  assert.equal(
    battery.interests.includes("drums"),
    false,
  );
  assert.equal(
    drums.interests.includes("drums"),
    true,
  );
  assert.equal(
    sleeve.interests.includes("manga"),
    false,
  );
  assert.equal(
    manga.interests.includes("manga"),
    true,
  );
});
