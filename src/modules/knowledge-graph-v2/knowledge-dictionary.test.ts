import assert from "node:assert/strict";
import test from "node:test";
import { dictionaryAliases, dictionaryRelations, type KnowledgeDictionary } from "./knowledge-dictionary.js";
import { KnowledgeDictionaryService, type KnowledgeDictionaryRepository } from "./knowledge-dictionary.service.js";

const dictionary: KnowledgeDictionary = { entities: {
  MATERIAL: [{ key: "bambu", name: "Bambú", aliases: ["bamboo"], compatibleWith: ["laser"] }],
  TECHNIQUE: [{ key: "laser", name: "Grabado láser", aliases: ["laser engraving"] }],
  CATEGORY: [{ key: "botellas", name: "Botellas", parent: "bebida" }, { key: "bebida", name: "Bebida" }],
} };

test("genera alias y relaciones semánticas desde el diccionario", () => {
  assert.deepEqual(dictionaryAliases(dictionary, "MATERIAL").bambu, ["bamboo"]);
  const relations = dictionaryRelations(dictionary);
  assert.ok(relations.some(item => item.type === "COMPATIBLE_WITH" && item.sourceKey === "bambu" && item.targetKey === "laser"));
  assert.ok(relations.some(item => item.type === "IS_A" && item.sourceKey === "botellas" && item.targetKey === "bebida"));
});

class MemoryRepo implements KnowledgeDictionaryRepository {
  entities = new Set<string>(); relations = new Set<string>();
  async upsertDictionaryEntity(type: any, entity: any) { const key=`${type}:${entity.key}`; const created=!this.entities.has(key); this.entities.add(key); return { id:key, created, aliasesCreated:created?(entity.aliases?.length??0):0 }; }
  async upsertDictionaryRelation(relation: any) { const key=JSON.stringify(relation); if(this.relations.has(key)) return "UNCHANGED" as const; this.relations.add(key); return "CREATED" as const; }
}

test("sincroniza el diccionario de forma idempotente", async () => {
  const repo=new MemoryRepo(); const service=new KnowledgeDictionaryService(repo);
  const first=await service.sync(dictionary); const second=await service.sync(dictionary);
  assert.equal(first.entitiesCreated,4); assert.equal(first.relationsCreated,2);
  assert.equal(second.entitiesCreated,0); assert.equal(second.relationsCreated,0); assert.equal(second.relationsUnchanged,2);
});
