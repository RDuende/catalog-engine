import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateProductInterestAffinity,
  expandInterestTerms,
} from "./interest-affinity.js";

test("cooking coincide con productos etiquetados como cocina", () => {
  const result = calculateProductInterestAffinity(
    {
      name: "Taza para amantes de la cocina",
      category: "DRINKWARE",
      tags: ["cocina", "chef"],
    },
    ["cooking"],
  );

  assert.equal(result.strongMatch, true);
  assert.equal(result.score >= 0.25, true);
  assert.equal(
    result.matchedTerms.includes("cocina"),
    true,
  );
});

test("cocina y cooking comparten expansión semántica", () => {
  const cooking = expandInterestTerms(["cooking"]);
  const cocina = expandInterestTerms(["cocina"]);

  assert.equal(cooking.includes("cocina"), true);
  assert.equal(cocina.includes("cooking"), true);
  assert.equal(cooking.includes("chef"), true);
  assert.equal(cocina.includes("kitchen"), true);
});

test("cooking no convierte fútbol en afinidad temática", () => {
  const result = calculateProductInterestAffinity(
    {
      name: "Llavero balón",
      category: "KEYRING",
      tags: ["fútbol", "deporte"],
    },
    ["cooking"],
  );

  assert.equal(result.score, 0);
  assert.equal(result.strongMatch, false);
});
