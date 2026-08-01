import assert from "node:assert/strict";
import test from "node:test";
import { detectProductKnowledge } from "./knowledge-detector.js";
import { KnowledgeGraphBuilderService } from "./knowledge-builder.service.js";
import type { CanonicalKnowledgeProduct, DetectedKnowledge, KnowledgeBuildResult, KnowledgeBuilderRepository } from "./knowledge-builder.types.js";

const product: CanonicalKnowledgeProduct = {
  id: "p1", providerKey: "makito", externalId: "MK-1", sku: "MK-1", name: "Botella RPET para sublimación",
  description: "Botella sostenible con certificado GRS", shortDescription: null, brand: "Makito", material: "Acero inoxidable / RPET",
  color: "Azul", dimensions: "500 ml", weight: 220, customizable: true, categories: ["Bidones"], tags: ["eco"], attributes: {}, metadata: {}, variants: [],
};

test("detecta conocimiento normalizado y elimina duplicados", () => {
  const result = detectProductKnowledge(product);
  assert.ok(result.some(item => item.type === "BRAND" && item.key === "makito"));
  assert.ok(result.some(item => item.type === "MATERIAL" && item.key === "acero_inoxidable"));
  assert.ok(result.some(item => item.type === "MATERIAL" && item.key === "rpet"));
  assert.ok(result.some(item => item.type === "TECHNIQUE" && item.key === "sublimacion"));
  assert.ok(result.some(item => item.type === "CERTIFICATE" && item.key === "grs"));
});

class MemoryRepository implements KnowledgeBuilderRepository {
  entities = new Map<string, string>(); links = new Set<string>(); finished?: KnowledgeBuildResult;
  async countProducts() { return 1; }
  async listProducts() { return [product]; }
  async upsertDetectedEntity(input: DetectedKnowledge) { const key = `${input.type}:${input.key}`; const old = this.entities.get(key); const id = old ?? `e${this.entities.size + 1}`; this.entities.set(key, id); return { id, created: !old, aliasUpserted: !old }; }
  async upsertProductLink(input: { productId: string; entityId: string; relationType: any }) { const key = `${input.productId}:${input.entityId}:${input.relationType}`; const exists = this.links.has(key); this.links.add(key); return exists ? "UNCHANGED" as const : "CREATED" as const; }
  async removeStaleAutoLinks() { return 0; }
  async startBuild() { return "run-1"; }
  async finishBuild(_id: string | undefined, result: KnowledgeBuildResult) { this.finished = result; }
}

test("construye el grafo de forma idempotente", async () => {
  const repository = new MemoryRepository();
  const service = new KnowledgeGraphBuilderService(repository);
  const first = await service.build();
  const second = await service.build();
  assert.equal(first.processed, 1);
  assert.ok(first.entitiesCreated > 0);
  assert.equal(second.entitiesCreated, 0);
  assert.equal(second.linksCreated, 0);
  assert.equal(second.linksUpdated, 0);
  assert.equal(second.linksUnchanged, first.linksCreated);
  assert.equal(second.writesAvoided, first.linksCreated);
});
