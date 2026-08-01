import assert from "node:assert/strict";
import test from "node:test";
import { RaiCommercialService } from "./rai-commercial.service.js";

const recommendation = {
  runId: "run-1", query: "regalo ecológico", profile: "eco", pipeline: "eco", totalCandidates: 10, elapsedMs: 10,
  metrics: { retrievalMs: 5, scoringMs: 2, candidatesRetrieved: 2, candidatesScored: 2, rulesEvaluated: 10, discardedByBudget: 0 },
  interpreted: { constraints: [], status: "ACTIVE" }, diagnostics: { resolvedTerms: 1, unresolvedTerms: [], candidatesEvaluated: 10, durationMs: 5 },
  items: [{ productId: "11111111-1111-4111-8111-111111111111", name: "Botella Bambú", slug: "botella-bambu", sku: "B1", description: null, score: 99, unitPrice: 4.5, currency: "EUR", categories: [], knowledge: ["Bambú"], customizable: true, reasons: ["Material sostenible"], warnings: [], explanation: { headline: "99 puntos", strengths: ["Material sostenible"], cautions: [] } }],
};

test("extrae contexto comercial y recomienda", async () => {
  const fake = { recommend: async () => recommendation } as any;
  const service = new RaiCommercialService(fake);
  const result = await service.chat({ message: "Necesito 500 unidades para una feria tecnológica, ecológicas y hasta 5 €", recommendNow: true });
  assert.equal(result.status, "recommendation");
  assert.equal(result.state.quantity, 500);
  assert.equal(result.state.budget, 5);
  assert.equal(result.state.profile, "eco");
  assert.match(result.reply, /Botella Bambú/);
});

test("mantiene el estado entre turnos", async () => {
  const fake = { recommend: async () => recommendation } as any;
  const service = new RaiCommercialService(fake);
  const first = await service.chat({ message: "Busco regalos para una clínica dental" });
  const second = await service.chat({ sessionId: first.sessionId, message: "500 unidades y máximo 4 euros", recommendNow: true });
  assert.equal(second.state.sector, "salud");
  assert.equal(second.state.quantity, 500);
  assert.equal(second.state.budget, 4);
});

test("selecciona un producto recomendado", async () => {
  const fake = { recommend: async () => recommendation } as any;
  const service = new RaiCommercialService(fake);
  const result = await service.chat({ message: "Necesito 100 regalos ecológicos", recommendNow: true });
  const selected = service.selectProduct(result.sessionId, recommendation.items[0]!.productId);
  assert.equal(selected.status, "selected");
  assert.equal(selected.state.selectedProductId, recommendation.items[0]!.productId);
});


test("extrae cantidad de expresiones como 500 regalos y normaliza contexto tecnológico", async () => {
  let captured: any;
  const fake = { recommend: async (request: any) => { captured = request; return recommendation; } } as any;
  const service = new RaiCommercialService(fake);
  const result = await service.chat({ message: "Necesito 500 regalos ecológicos para una feria tecnológica, personalizables y hasta 5 euros", recommendNow: true });
  assert.equal(result.state.quantity, 500);
  assert.equal(result.state.sector, "tecnologia");
  assert.match(captured.query, /tecnologia/);
  assert.match(captured.query, /sostenible/);
  assert.doesNotMatch(captured.query, /500/);
});
