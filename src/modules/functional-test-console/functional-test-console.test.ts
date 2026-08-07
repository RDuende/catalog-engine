import assert from "node:assert/strict";
import test from "node:test";

import {
  FUNCTIONAL_TEST_SCENARIOS,
} from "./functional-test.scenarios.js";

test("la batería funcional contiene escenarios únicos", () => {
  const ids =
    FUNCTIONAL_TEST_SCENARIOS.map(
      (scenario) =>
        scenario.id,
    );

  assert.equal(
    new Set(ids).size,
    ids.length,
  );

  assert.equal(
    ids.length >= 35,
    true,
  );
});

test("la batería cubre los núcleos principales", () => {
  const groups =
    new Set(
      FUNCTIONAL_TEST_SCENARIOS
        .map(
          (scenario) =>
            scenario.group,
        ),
    );

  for (const expected of [
    "01 · Intent Brain",
    "02 · Emotion Brain",
    "03 · Interest Brain V2",
    "04 · Conversation Engine",
    "05 · Memory Brain",
    "06 · Intelligence Runtime",
    "07 · Personalización + Mockup E2E",
  ]) {
    assert.equal(
      groups.has(expected),
      true,
    );
  }
});

test("cada escenario tiene objetivo y prioridad", () => {
  for (
    const scenario of
    FUNCTIONAL_TEST_SCENARIOS
  ) {
    assert.equal(
      scenario.objective.trim()
        .length > 0,
      true,
    );

    assert.equal(
      [
        "CRITICAL",
        "HIGH",
        "MEDIUM",
        "LOW",
      ].includes(
        scenario.priority,
      ),
      true,
    );
  }
});
