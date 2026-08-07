import assert from "node:assert/strict";
import test from "node:test";
import { collectProviderMarkingEvidence, techniquesFromEvidence } from "./marking-intelligence.service.js";
import { normalizeMarkingTechnique } from "./marking-technique.normalizer.js";

test("normaliza técnicas habituales", () => {
  assert.equal(normalizeMarkingTechnique("Sublimación").code, "SUBLIMATION");
  assert.equal(normalizeMarkingTechnique("DTF UV").code, "DTF_UV");
  assert.equal(normalizeMarkingTechnique("Grabación Láser").code, "LASER");
  assert.equal(normalizeMarkingTechnique("Tampografía").code, "PAD_PRINTING");
});

test("descubre técnicas del raw del proveedor", () => {
  const evidence = collectProviderMarkingEvidence({ marking: { techniques: ["Sublimación", "DTF UV", "Láser"] } });
  const codes = techniquesFromEvidence(evidence).map((x) => x.code);
  assert.ok(codes.includes("SUBLIMATION"));
  assert.ok(codes.includes("DTF_UV"));
  assert.ok(codes.includes("LASER"));
});
