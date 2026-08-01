import assert from "node:assert/strict";
import test from "node:test";
import { SalesBrainService } from "./sales-brain.service.js";

const service = new SalesBrainService({ recommend: async () => ({ query: "x", profile: "eco", pipeline: "eco", totalCandidates: 1, elapsedMs: 1, metrics: { retrievalMs: 1, scoringMs: 0, candidatesRetrieved: 1, candidatesScored: 1, rulesEvaluated: 1, discardedByBudget: 0 }, interpreted: { constraints: [], providerKey: "makito", status: "ACTIVE" }, diagnostics: { resolvedTerms: 0, unresolvedTerms: [], candidatesEvaluated: 1, durationMs: 1 }, items: [{ productId: "11111111-1111-4111-8111-111111111111", sku: "A1", name: "Botella", slug: "botella", description: null, score: 90, unitPrice: 3, currency: "EUR", categories: [], knowledge: [], customizable: true, reasons: ["Adecuada"], providerKey: "makito", externalId: "A1", warnings: [], matchedEntities: [] }], runId: "22222222-2222-4222-8222-222222222222" }) } as never);

test("detecta contexto comercial y datos faltantes", () => {
  const analysis = service.analyze("Necesito 500 regalos ecológicos para una feria tecnológica hasta 5 euros");
  assert.equal(analysis.context.quantity, 500);
  assert.equal(analysis.context.budget, 5);
  assert.equal(analysis.context.sector, "tecnologia");
  assert.equal(analysis.context.profile, "eco");
  assert.deepEqual(analysis.missingFields, ["customizable"]);
  assert.equal(analysis.context.pendingField, "customizable");
});

test("genera una propuesta comercial explicable", async () => {
  const decision = await service.decide({ message: "Prepara una propuesta de 500 regalos ecológicos para una feria tecnológica hasta 5 euros", recommendNow: true });
  assert.equal(decision.strategy, "PROPOSE");
  assert.ok(decision.proposal);
  assert.equal(decision.proposal.quantity, 500);
  assert.ok((decision.proposal.lines[0]?.total ?? 0) > 1500);
  assert.ok(decision.proposal.lines[0]?.pricing);
});

test("un saludo no dispara búsquedas ni recomendaciones", async () => {
  let calls = 0;
  const greetingService = new SalesBrainService({
    recommend: async () => {
      calls += 1;
      throw new Error("No debería buscar productos para un saludo");
    },
  } as never);
  const decision = await greetingService.decide({ message: "hola Rai", recommendNow: true });
  assert.equal(decision.strategy, "ASK");
  assert.equal(decision.analysis.shouldRecommend, false);
  assert.deepEqual(decision.analysis.missingFields, ["need"]);
  assert.equal(decision.recommendation, undefined);
  assert.equal(calls, 0);
});


test("mantiene el contexto y pregunta un requisito cada vez", async () => {
  let decision = await service.decide({ message: "Necesito un regalo para una feria" });
  assert.equal(decision.strategy, "ASK");
  assert.equal(decision.analysis.context.pendingField, "quantity");

  decision = await service.decide({ message: "500", context: decision.analysis.context });
  assert.equal(decision.analysis.context.quantity, 500);
  assert.equal(decision.analysis.context.pendingField, "budget");

  decision = await service.decide({ message: "5 €", context: decision.analysis.context });
  assert.equal(decision.analysis.context.budget, 5);
  assert.equal(decision.analysis.context.pendingField, "sustainability");

  decision = await service.decide({ message: "sí", context: decision.analysis.context });
  assert.equal(decision.analysis.context.sustainability, true);
  assert.equal(decision.analysis.context.pendingField, "customizable");

  decision = await service.decide({ message: "sí", context: decision.analysis.context });
  assert.equal(decision.analysis.context.customizable, true);
  assert.equal(decision.strategy, "RECOMMEND");
  assert.ok(decision.recommendation?.items.length);
});
