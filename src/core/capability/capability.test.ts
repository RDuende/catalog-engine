import assert from "node:assert/strict";
import test from "node:test";
import { CapabilityEngine } from "./index.js";

test("filtra productos por capacidades", () => {
  const engine = new CapabilityEngine([
    { id: "c1", productId: "p1", code: "photo", category: "personalization", value: true, confidence: 1, source: "manual" },
    { id: "c2", productId: "p1", code: "text", category: "personalization", value: true, confidence: 1, source: "manual" },
    { id: "c3", productId: "p2", code: "text", category: "personalization", value: true, confidence: 1, source: "manual" },
  ]);
  assert.deepEqual(engine.findProducts([{ code: "photo", value: true }, { code: "text", value: true }]), ["p1"]);
});
