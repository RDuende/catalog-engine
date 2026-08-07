import assert from "node:assert/strict";
import test from "node:test";
import { AgentToolExecutor } from "./agent.tools.js";

test("sin personalización no excluye productos personalizables y limpia la query", async () => {
  let captured: any;
  const recommendationService = {
    async recommend(request: any) {
      captured = request;
      return {
        query: request.query, profile: "default", pipeline: "general", totalCandidates: 170, elapsedMs: 1,
        metrics: { retrievalMs: 1, scoringMs: 1, candidatesRetrieved: 100, candidatesScored: 100, rulesEvaluated: 800, discardedByBudget: 0 },
        interpreted: { constraints: [], status: "ACTIVE" }, diagnostics: { resolvedTerms: 0, unresolvedTerms: [], candidatesEvaluated: 170, durationMs: 1 },
        items: [], analysis: { returned: 0, discarded: 0, discardedAlternatives: [] },
      };
    },
  };
  const executor = new AgentToolExecutor(recommendationService as any);
  const state: any = { context: { need: "taza", quantity: 1, budget: 15, currency: "EUR", providerKey: "makito", personalizationRequested: false }, patches: [] };
  const result: any = await executor.execute("search_products", { query: "taza blanca sin personalizar proveedor makito", limit: 6, personalizationRequested: false }, state);
  assert.equal(captured.query, "taza blanca");
  assert.equal(captured.customizable, undefined);
  assert.equal(result.catalogAccess.accessible, true);
  assert.equal(result.catalogAccess.candidatesEvaluated, 170);
});

test("si se solicita marcaje exige capacidad de personalización", async () => {
  let captured: any;
  const service = { async recommend(request: any) { captured = request; return { query: request.query, profile:"default", pipeline:"general", totalCandidates:0, elapsedMs:0, metrics:{retrievalMs:0,scoringMs:0,candidatesRetrieved:0,candidatesScored:0,rulesEvaluated:0,discardedByBudget:0}, interpreted:{constraints:[],status:"ACTIVE"}, diagnostics:{resolvedTerms:0,unresolvedTerms:[],candidatesEvaluated:0,durationMs:0}, items:[], analysis:{returned:0,discarded:0,discardedAlternatives:[]} }; } };
  const executor = new AgentToolExecutor(service as any);
  await executor.execute("search_products", { query: "taza", limit: 3, personalizationRequested: true }, { context: { need:"taza",quantity:1,budget:15 }, patches: [] } as any);
  assert.equal(captured.customizable, true);
});
