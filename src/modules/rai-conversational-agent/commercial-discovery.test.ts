import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCommercialDiscovery } from "./agent.tools.js";

test("empresa requiere destinatario objetivo cantidad y presupuesto", () => {
  const result = evaluateCommercialDiscovery({ customerType: "BUSINESS", audience: "clientes", businessGoal: "agradecer", quantity: 100, budget: 5 });
  assert.equal(result.ready, true);
});

test("particular que quiere propuestas requiere perfil básico del receptor", () => {
  const result = evaluateCommercialDiscovery({ customerType: "CONSUMER", giftDiscoveryMode: "WANTS_SUGGESTIONS", recipientRelationship: "hermana", occasion: "cumpleaños", budget: 30 });
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes("recipientAge"));
  assert.ok(result.missing.includes("recipientInterests"));
});

test("particular con idea puede recomendar con receptor ocasión y presupuesto", () => {
  const result = evaluateCommercialDiscovery({ customerType: "CONSUMER", giftDiscoveryMode: "HAS_IDEA", need: "taza personalizada", recipientRelationship: "amiga", occasion: "cumpleaños", budget: 20 });
  assert.equal(result.ready, true);
});
