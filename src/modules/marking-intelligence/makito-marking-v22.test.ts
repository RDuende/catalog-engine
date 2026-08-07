import assert from "node:assert/strict";
import test from "node:test";
import { parseMakitoTechniqueString } from "./makito-marking-v22.js";

test("separa técnicas adyacentes sin coma", () => {
  const result =
    parseMakitoTechniqueString(
      "100114(1)100400(1)",
    );

  assert.deepEqual(
    result.tokens,
    [
      "100114(1)",
      "100400(1)",
    ],
  );

  assert.equal(
    result.normalized,
    "100114(1),100400(1)",
  );

  assert.equal(
    result.malformed,
    false,
  );
});

test("detecta residuo en cadena dañada", () => {
  const result =
    parseMakitoTechniqueString(
      "10060281)",
    );

  assert.deepEqual(
    result.tokens,
    ["100602"],
  );

  assert.equal(
    result.normalized,
    "100602",
  );

  assert.equal(
    result.malformed,
    true,
  );

  assert.equal(
    result.residue,
    "81)",
  );
});

test("mantiene una lista válida", () => {
  const result =
    parseMakitoTechniqueString(
      "100400,100112(4),101007(1)",
    );

  assert.deepEqual(
    result.tokens,
    [
      "100400",
      "100112(4)",
      "101007(1)",
    ],
  );

  assert.equal(
    result.malformed,
    false,
  );
});
