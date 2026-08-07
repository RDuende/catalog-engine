import assert from "node:assert/strict";
import test from "node:test";
import { ReasoningEngine } from "./index.js";
import type { ParsedIntent } from "../intent/model.js";
import type { ResolvedSolution } from "../solution/model.js";

const intent: ParsedIntent = {
  rawText: "Regalo con foto para profesora por menos de 30 euros",
  normalizedText: "regalo con foto para profesora por menos de 30 euros",
  recipient: "profesora",
  occasion: "fin-de-curso",
  maxPriceMinor: 3000,
  personalization: true,
  priority: "normal",
  attributes: { emotion: ["agradecimiento"] },
  terms: ["foto", "profesora"], confidence: 0.95, warnings: [],
};

const explanation = {
  headline: "Fixture de prueba",
  confidence: 1,
  strengths: [],
  cautions: [],
  matchedConstraints: [],
  violatedConstraints: [],
  rankingFactors: [],
} as const;

const solution: ResolvedSolution = {
  definition: { id: "teacher", name: "Detalle de agradecimiento para docente", recipients: ["profesora"], emotions: ["agradecimiento"] },
  score: 80, reasons: ["Adecuada"], criteria: {}, intent,
};

test("descarta candidatos que incumplen restricciones obligatorias", () => {
  const trace = new ReasoningEngine().reason({ intent, solution, candidates: [
    { productId: "1", sku: null, name: "Marco personalizado profesora", slug: "marco", description: "Marco con foto", score: 70, unitPrice: 24, currency: "EUR", categories: ["Marcos"], knowledge: ["agradecimiento"], customizable: true, reasons: [], explanation },
    { productId: "2", sku: null, name: "Figura premium", slug: "figura", description: null, score: 90, unitPrice: 45, currency: "EUR", categories: [], knowledge: [], customizable: false, reasons: [], explanation },
  ]});
  assert.equal(trace.decisions[0]?.item.productId, "1");
  assert.equal(trace.decisions[0]?.eligible, true);
  assert.equal(trace.decisions[1]?.eligible, false);
  assert.equal(trace.rejectedCandidates, 1);
  assert.match(trace.decisions[0]?.explanation ?? "", /recomienda/);
});

test("expone una traza auditable con restricciones y evidencias", () => {
  const trace = new ReasoningEngine().reason({ intent, solution, candidates: [{ productId: "1", sku: "M1", name: "Marco profesora", slug: "marco", description: "Recuerdo de agradecimiento", score: 65, unitPrice: 20, currency: "EUR", categories: ["Regalos"], knowledge: ["profesora", "agradecimiento"], customizable: true, reasons: [], explanation }] });
  assert.equal(trace.version, "1.0");
  assert.ok(trace.constraints.some((constraint) => constraint.code === "BUDGET"));
  assert.ok(trace.decisions[0]?.evidence.some((entry) => entry.code === "SOLUTION_AFFINITY"));
  assert.ok((trace.decisions[0]?.finalScore ?? 0) > 0);
});
