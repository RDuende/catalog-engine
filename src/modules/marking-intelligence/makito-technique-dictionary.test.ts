import assert from "node:assert/strict";
import test from "node:test";

import { canonicalTechniqueLabel } from "./makito-technique-dictionary.js";

test("normaliza etiquetas conocidas de marcaje", () => {
  assert.equal(canonicalTechniqueLabel("Serigrafía"), "Serigrafía");
  assert.equal(canonicalTechniqueLabel("Grabación Láser"), "Grabación láser");
  assert.equal(canonicalTechniqueLabel("DTF UV"), "DTF UV");
  assert.equal(canonicalTechniqueLabel("Sublimación"), "Sublimación");
});

test("extrae una técnica desde una ruta de categoría", () => {
  assert.equal(
    canonicalTechniqueLabel("Técnicas de marcaje > Técnicas de marcaje > Serigrafía"),
    "Serigrafía",
  );
});
