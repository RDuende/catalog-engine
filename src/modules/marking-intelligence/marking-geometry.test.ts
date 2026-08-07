import assert from "node:assert/strict";
import test from "node:test";

import {
  validatePlacementGeometry,
} from "./marking-geometry.js";

test("acepta geometría normalizada", () => {
  const result =
    validatePlacementGeometry({
      x: 0.2,
      y: 0.3,
      width: 0.4,
      height: 0.1,
      rotation: 2,
      geometrySource: "ADMIN",
    });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(
      result.value.rotation,
      2,
    );
    assert.equal(
      result.value.geometrySource,
      "ADMIN",
    );
  }
});

test("acepta perspectiva de cuatro esquinas", () => {
  const result =
    validatePlacementGeometry({
      x: 0.2,
      y: 0.2,
      width: 0.5,
      height: 0.2,
      corners: {
        topLeft: {
          x: 0.2,
          y: 0.2,
        },
        topRight: {
          x: 0.7,
          y: 0.22,
        },
        bottomRight: {
          x: 0.68,
          y: 0.4,
        },
        bottomLeft: {
          x: 0.22,
          y: 0.39,
        },
      },
      geometrySource: "ADMIN",
    });

  assert.equal(
    result.ok,
    true,
  );
});

test("rechaza geometría fuera de imagen", () => {
  const result =
    validatePlacementGeometry({
      x: 0.8,
      y: 0.2,
      width: 0.4,
      height: 0.2,
    });

  assert.equal(
    result.ok,
    false,
  );
});
