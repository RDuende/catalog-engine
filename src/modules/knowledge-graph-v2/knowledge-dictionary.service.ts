import type { KnowledgeDictionary, DictionaryEntity, DictionaryRelationDefinition } from "./knowledge-dictionary.js";
import { dictionaryRelations, loadKnowledgeDictionary } from "./knowledge-dictionary.js";
import type { KnowledgeEntityType, KnowledgeRelationType } from "./knowledge-graph.types.js";

export interface KnowledgeDictionaryRepository {
  upsertDictionaryEntity(type: KnowledgeEntityType, entity: DictionaryEntity): Promise<{ id: string; created: boolean; aliasesCreated: number }>;
  upsertDictionaryRelation(relation: DictionaryRelationDefinition): Promise<"CREATED" | "UPDATED" | "UNCHANGED" | "SKIPPED">;
}

export interface DictionarySyncResult {
  entitiesCreated: number;
  entitiesReused: number;
  aliasesCreated: number;
  relationsCreated: number;
  relationsUpdated: number;
  relationsUnchanged: number;
  relationsSkipped: number;
}

export class KnowledgeDictionaryService {
  constructor(private readonly repository: KnowledgeDictionaryRepository) {}

  async sync(dictionary?: KnowledgeDictionary): Promise<DictionarySyncResult> {
    const source = dictionary ?? await loadKnowledgeDictionary();
    const result: DictionarySyncResult = { entitiesCreated: 0, entitiesReused: 0, aliasesCreated: 0, relationsCreated: 0, relationsUpdated: 0, relationsUnchanged: 0, relationsSkipped: 0 };
    for (const [type, entities] of Object.entries(source.entities) as Array<[KnowledgeEntityType, DictionaryEntity[]]>) {
      for (const entity of entities ?? []) {
        const saved = await this.repository.upsertDictionaryEntity(type, entity);
        saved.created ? result.entitiesCreated++ : result.entitiesReused++;
        result.aliasesCreated += saved.aliasesCreated;
      }
    }
    for (const relation of dictionaryRelations(source)) {
      const status = await this.repository.upsertDictionaryRelation(relation);
      if (status === "CREATED") result.relationsCreated++;
      else if (status === "UPDATED") result.relationsUpdated++;
      else if (status === "UNCHANGED") result.relationsUnchanged++;
      else result.relationsSkipped++;
    }
    return result;
  }
}
