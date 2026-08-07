import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateProductInterestAffinity,
  expandInterestTerms,
} from "./interest-affinity.js";

test("expandInterestTerms conserva su contrato de string[]", () => {
  const terms = expandInterestTerms([
    "cooking",
  ]);

  assert.equal(Array.isArray(terms), true);
  assert.equal(
    terms.includes("cocina"),
    true,
  );
});

test("una coincidencia canónica exacta obtiene afinidad máxima", () => {
  const result =
    calculateProductInterestAffinity(
      {
        canonicalInterests: [
          "cooking",
        ],
        name: "Artículo personalizado",
        category: "GENERAL",
        tags: [],
      },
      ["cooking"],
    );

  assert.equal(result.score, 1);
  assert.equal(result.strongMatch, true);
  assert.deepEqual(
    result.matchedTerms,
    ["cooking"],
  );
});

test("sin coincidencia canónica mantiene la afinidad textual", () => {
  const result =
    calculateProductInterestAffinity(
      {
        canonicalInterests: [
          "football",
        ],
        name: "Delantal para chef",
        category: "TEXTILE",
        tags: ["cocina"],
      },
      ["cooking"],
    );

  assert.equal(result.score >= 0.25, true);
  assert.equal(result.strongMatch, true);
});
