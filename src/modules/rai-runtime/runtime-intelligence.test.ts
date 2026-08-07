import assert from "node:assert/strict";
import test from "node:test";
import { QuestionRankingEngine } from "./question-ranking.js";
import { RequirementPolicyEngine } from "./requirement-policy.js";

const policies = new RequirementPolicyEngine();

test("solo los requisitos obligatorios bloquean una recomendación", () => {
  const result = policies.evaluate("RECOMMEND_PRODUCTS", {
    need: "regalo de empresa",
    quantity: 500,
    budget: 5,
    customizable: true,
    providerKey: "makito",
    currency: "EUR",
  });

  assert.equal(result.blocking, false);
  assert.equal(result.requiredMissing.length, 0);
  assert.ok(result.optionalMissing.some((item) => item.field === "sustainability"));
  assert.ok(!result.requiredMissing.includes("providerKey"));
});

test("ordena primero las preguntas obligatorias", () => {
  const evaluation = policies.evaluate("RECOMMEND_PRODUCTS", { need: "regalo" });
  const ranked = new QuestionRankingEngine().rank(evaluation.requiredMissing, evaluation.optionalMissing);
  assert.equal(ranked[0]?.field, "quantity");
  assert.equal(ranked[0]?.blocking, true);
  assert.ok((ranked[0]?.score ?? 0) > (ranked.at(-1)?.score ?? 0));
});

test("la política de propuesta prioriza el plazo como dato opcional", () => {
  const evaluation = policies.evaluate("PREPARE_PROPOSAL", {
    need: "botellas",
    quantity: 100,
    budget: 8,
    customizable: true,
  });
  assert.equal(evaluation.blocking, false);
  assert.equal(evaluation.optionalMissing[0]?.field, "deadline");
});
