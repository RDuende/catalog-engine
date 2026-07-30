import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeGraph } from "./graph.js";
import type { KnowledgeGraphSnapshot } from "./model.js";

const snapshot: KnowledgeGraphSnapshot = {
  kind: "KnowledgeGraph",
  schemaVersion: "2.0",
  graphVersion: 1,
  generatedAt: "2026-07-26T00:00:00.000Z",
  sourceFile: "test",
  entities: [
    { id: "product:1", type: "product", label: "Taza", normalizedLabel: "taza", valid: true, confidence: 0.95, metadata: {} },
    { id: "attribute:occasion:profesor", type: "attribute", attributeType: "occasion", value: "Profesor", label: "Profesor", normalizedLabel: "profesor", confidence: 0.9, metadata: {} },
    { id: "attribute:emotion:gratitud", type: "attribute", attributeType: "emotion", value: "Gratitud", label: "Gratitud", normalizedLabel: "gratitud", confidence: 0.85, metadata: {} },
  ],
  relations: [
    { id: "r1", from: "product:1", to: "attribute:occasion:profesor", type: "SUITABLE_FOR", confidence: 0.9, weight: 0.8, metadata: {} },
    { id: "r2", from: "attribute:occasion:profesor", to: "attribute:emotion:gratitud", type: "RELATED_TO", confidence: 0.8, weight: 0.75, metadata: {} },
  ],
  statistics: { products: 1, categories: 0, attributes: 2, relations: 2 },
};

test("Knowledge Graph V2 traverses weighted typed relations", () => {
  const graph = new KnowledgeGraph(snapshot);
  const paths = graph.paths("product:1", { maxDepth: 2, minConfidence: 0.7 });
  assert.equal(paths.length, 2);
  const firstPath = paths[0];
  const secondPath = paths[1];
  assert.ok(firstPath);
  assert.ok(secondPath);

  const firstStep = firstPath.steps[0];
  assert.ok(firstStep);
  assert.equal(firstStep.entity.id, "attribute:occasion:profesor");
  assert.ok(firstPath.score > secondPath.score);

  const explanation = graph.explainPath(secondPath);
  const relatedExplanation = explanation[1];
  assert.ok(relatedExplanation);
  assert.match(relatedExplanation, /RELATED_TO/);
});

test("Knowledge Graph V2 filters relations by type and weight", () => {
  const graph = new KnowledgeGraph(snapshot);
  const paths = graph.paths("product:1", { maxDepth: 3, relationTypes: ["SUITABLE_FOR"], minWeight: 0.8 });
  assert.equal(paths.length, 1);
  const path = paths[0];
  assert.ok(path);
  const step = path.steps[0];
  assert.ok(step);
  assert.equal(step.relation.type, "SUITABLE_FOR");
});

test("product queries support minimum confidence", () => {
  const graph = new KnowledgeGraph(snapshot);
  assert.equal(graph.products({ minConfidence: 0.96 }).length, 0);
  assert.equal(graph.products({ minConfidence: 0.9 }).length, 1);
});
