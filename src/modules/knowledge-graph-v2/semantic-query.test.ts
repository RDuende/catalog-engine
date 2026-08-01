import assert from "node:assert/strict";
import test from "node:test";
import { inferSemanticConstraints } from "./semantic-query.parser.js";
import { SemanticQueryService } from "./semantic-query.service.js";
import type { SemanticQueryRepository } from "./semantic-query.repository.js";

const entities = {
  bambu: [{ id: "1", type: "MATERIAL" as const, key: "bambu", name: "Bambú" }],
  laser: [{ id: "2", type: "TECHNIQUE" as const, key: "grabado_laser", name: "Grabado láser" }],
};

test("interpreta términos y negaciones básicas", () => {
  const result = inferSemanticConstraints({ query: "regalo de bambú con láser sin plástico" });
  assert.ok(result.some(item => item.term === "bambu" && item.mode === "SHOULD"));
  assert.ok(result.some(item => item.term === "plastico" && item.mode === "EXCLUDE"));
});

test("resuelve restricciones y devuelve recomendaciones explicadas", async () => {
  const repo: SemanticQueryRepository = {
    async resolveTerm(term) { return entities[term as keyof typeof entities] ?? []; },
    async recommend(_input, constraints) {
      assert.equal(constraints.filter(item => item.entityIds.length).length, 2);
      return {
        candidatesEvaluated: 1,
        products: [{
          id: "p1", providerKey: "makito", externalId: "x", sku: "SKU", name: "Set de bambú", description: null,
          customizable: true, score: 41.8, matchedMust: 0, matchedShould: 2,
          matchedEntities: [], reasons: ["Relacionado con Bambú", "Relacionado con Grabado láser"],
        }],
      };
    },
  };
  const result = await new SemanticQueryService(repo).query({ query: "bambú láser", customizable: true });
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.diagnostics.resolvedTerms, 2);
  assert.deepEqual(result.diagnostics.unresolvedTerms, []);
});

test("admite restricciones MUST explícitas", async () => {
  const repo: SemanticQueryRepository = {
    async resolveTerm() { return entities.bambu; },
    async recommend(_input, constraints) {
      assert.equal(constraints[0]?.mode, "MUST");
      return { products: [], candidatesEvaluated: 0 };
    },
  };
  await new SemanticQueryService(repo).query({ query: "ecológico", constraints: [{ term: "bambú", type: "MATERIAL", mode: "MUST" }] });
});


test("no informa como no resuelta una frase compuesta cuyos términos sí fueron resueltos", async () => {
  const repo: SemanticQueryRepository = {
    async resolveTerm(term) { return entities[term as keyof typeof entities] ?? []; },
    async recommend() { return { products: [], candidatesEvaluated: 0 }; },
  };
  const result = await new SemanticQueryService(repo).query({ query: "bambú láser" });
  assert.equal(result.diagnostics.resolvedTerms, 2);
  assert.deepEqual(result.diagnostics.unresolvedTerms, []);
});
