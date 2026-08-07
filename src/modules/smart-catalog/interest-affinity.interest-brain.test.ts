import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateProductInterestAffinity,
} from "./interest-affinity.js";

test("encuentra afinidad específica cooking-cocina", () => {
  const result =
    calculateProductInterestAffinity(
      {
        name: "Delantal de chef",
        category: "TEXTILE",
        tags: [
          "cocina",
          "repostería",
        ],
      },
      ["cooking"],
    );

  assert.equal(result.strongMatch, true);
  assert.equal(result.score >= 0.25, true);
  assert.equal(
    result.canonicalInterests?.includes(
      "cooking",
    ),
    true,
  );
});

test("una palabra contextual genérica no supera el umbral", () => {
  const result =
    calculateProductInterestAffinity(
      {
        name: "Bolsa natural",
        category: "BAGS",
        tags: ["natural"],
      },
      ["gardening"],
    );

  assert.equal(result.strongMatch, false);
  assert.equal(result.score < 0.25, true);
});
