import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultInterestBrain,
} from "./interest-brain.service.js";

test("normaliza intereses bilingües a un canon", () => {
  const cooking =
    defaultInterestBrain.expand([
      "cooking",
    ]);
  const cocina =
    defaultInterestBrain.expand([
      "cocina",
    ]);

  assert.equal(
    cooking.canonicalIds.includes(
      "cooking",
    ),
    true,
  );
  assert.equal(
    cocina.canonicalIds.includes(
      "cooking",
    ),
    true,
  );
  assert.equal(
    cooking.directTerms.includes(
      "cocina",
    ),
    true,
  );
});

test("detecta intereses específicos en texto libre", () => {
  const matches =
    defaultInterestBrain.match(
      "Le encanta hacer tartas y hornear cupcakes",
    );

  assert.equal(
    matches.some(
      (item) =>
        item.interestId === "baking",
    ),
    true,
  );
});

test("no confunde fútbol con cocina", () => {
  const matches =
    defaultInterestBrain.match(
      "Es fan del fútbol y juega de portero",
    );

  assert.equal(
    matches[0]?.interestId,
    "football",
  );
  assert.equal(
    matches.some(
      (item) =>
        item.interestId === "cooking",
    ),
    false,
  );
});

test("la base inicial cubre múltiples dominios", () => {
  const definitions =
    defaultInterestBrain.list();
  const domains = new Set(
    definitions.map(
      (item) => item.domain,
    ),
  );

  assert.equal(
    definitions.length >= 100,
    true,
  );
  assert.equal(
    domains.size >= 12,
    true,
  );
});
