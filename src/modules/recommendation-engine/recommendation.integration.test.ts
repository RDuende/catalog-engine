import assert from "node:assert/strict";
import test from "node:test";
import { RecommendationService } from "./recommendation.service.js";
import type { RecommendationRepository } from "./recommendation.repository.js";

const semanticResult = {
  query: "botella bambu laser",
  interpreted: { constraints: [], status: "ACTIVE" },
  recommendations: [
    { id: "p1", providerKey: "makito", externalId: "1", sku: "A", name: "Botella Bamboo", description: "Botella ecológica", customizable: true, score: 140, matchedMust: 1, matchedShould: 1, matchedEntities: [{ id: "e1", type: "MATERIAL", key: "bambu", name: "Bambú", confidence: 1, mode: "MUST" }, { id: "e2", type: "TECHNIQUE", key: "laser", name: "Grabado láser", confidence: 1, mode: "SHOULD" }], reasons: ["Cumple Bambú (material)"] },
    { id: "p2", providerKey: "makito", externalId: "2", sku: "B", name: "Botella Premium", description: "Botella premium", customizable: true, score: 60, matchedMust: 0, matchedShould: 1, matchedEntities: [{ id: "e2", type: "TECHNIQUE", key: "laser", name: "Grabado láser", confidence: 1, mode: "SHOULD" }], reasons: ["Relacionado con Grabado láser (technique)"] },
  ],
  diagnostics: { resolvedTerms: 2, unresolvedTerms: [], candidatesEvaluated: 2, durationMs: 4 },
};

const semanticService = { query: async () => semanticResult } as any;
const repository: RecommendationRepository = {
  async findByIds() {
    return [
      { id: "p1", providerKey: "makito", externalId: "1", sku: "A", name: "Botella Bamboo", description: "Botella ecológica", shortDescription: null, material: "bambú", customizable: true, categories: ["Botellas"], tags: ["eco"], attributes: {}, metadata: { price: 3.5, popularityScore: 5 } },
      { id: "p2", providerKey: "makito", externalId: "2", sku: "B", name: "Botella Premium", description: "Botella premium", shortDescription: null, material: "acero", customizable: true, categories: ["Botellas"], tags: [], attributes: {}, metadata: { price: 7.5 } },
    ];
  },
};

test("integrates semantic candidates, canonical data and commercial ranking", async () => {
  const service = new RecommendationService({ semanticService, repository });
  const result = await service.recommend({ query: "botella bambu laser", budget: 5, customizable: true });
  assert.equal(result.items.length, 1);
  const firstItem = result.items[0];
  assert.ok(firstItem);
  assert.equal(firstItem.productId, "p1");
  assert.equal(firstItem.unitPrice, 3.5);
  assert.equal(firstItem.matchedEntities?.length, 2);
  assert.equal(result.diagnostics.resolvedTerms, 2);
});

test("forwards provider and semantic constraints", async () => {
  let received: any;
  const service = new RecommendationService({
    semanticService: { query: async (input: any) => { received = input; return { ...semanticResult, recommendations: [] }; } } as any,
    repository: { findByIds: async () => [] },
  });
  await service.recommend({ query: "eco", providerKey: "makito", categorySlugs: ["botellas"], knowledgeSlugs: ["fsc"] });
  assert.equal(received.providerKey, "makito");
  assert.equal(received.constraints.length, 2);
  assert.equal(received.constraints[0].type, "CATEGORY");
});
