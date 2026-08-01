import assert from "node:assert/strict";
import test from "node:test";
import { ProductionIntelligenceService } from "./production-intelligence.service.js";

test("recomienda láser de fibra para metal", () => {
  const result = new ProductionIntelligenceService().plan({ quantity: 500, technique: "laser", knowledge: ["Acero inoxidable"] });
  assert.equal(result.recommended?.machineId, "laser_fiber");
  assert.equal(result.recommended?.meetsRequestedLeadTime, null);
  assert.ok((result.recommended?.estimatedCost ?? 0) > 0);
});

test("avisa cuando no cumple el plazo", () => {
  const result = new ProductionIntelligenceService().plan({ quantity: 5000, technique: "screen_printing", categories: ["Textil algodón"], requestedLeadDays: 1 });
  assert.equal(result.recommended?.meetsRequestedLeadTime, false);
  assert.ok(result.recommended?.warnings.length);
});
