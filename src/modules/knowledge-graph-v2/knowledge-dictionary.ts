import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeKey } from "./knowledge-graph.utils.js";
import type { KnowledgeEntityType, KnowledgeRelationType } from "./knowledge-graph.types.js";

export interface DictionaryEntity {
  key: string;
  name: string;
  aliases?: string[];
  parent?: string;
  compatibleWith?: string[];
  requires?: string[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgeDictionary {
  entities: Partial<Record<KnowledgeEntityType, DictionaryEntity[]>>;
}

const FILES: Array<[KnowledgeEntityType, string]> = [
  ["MATERIAL", "materials.json"],
  ["TECHNIQUE", "techniques.json"],
  ["CERTIFICATE", "certificates.json"],
  ["CATEGORY", "categories.json"],
];

export async function loadKnowledgeDictionary(directory = join(process.cwd(), "knowledge")): Promise<KnowledgeDictionary> {
  const entities: KnowledgeDictionary["entities"] = {};
  for (const [type, filename] of FILES) {
    try {
      const parsed = JSON.parse(await readFile(join(directory, filename), "utf8")) as { entities?: DictionaryEntity[] };
      entities[type] = (parsed.entities ?? []).map(item => ({
        ...item,
        key: normalizeKey(item.key),
        aliases: [...new Set([item.name, ...(item.aliases ?? [])])],
        parent: item.parent ? normalizeKey(item.parent) : undefined,
        compatibleWith: item.compatibleWith?.map(normalizeKey),
        requires: item.requires?.map(normalizeKey),
      }));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      entities[type] = [];
    }
  }
  return { entities };
}

export function dictionaryAliases(dictionary: KnowledgeDictionary, type: KnowledgeEntityType): Record<string, string[]> {
  return Object.fromEntries((dictionary.entities[type] ?? []).map(entity => [entity.key, entity.aliases ?? [entity.name]]));
}

export interface DictionaryRelationDefinition {
  sourceType: KnowledgeEntityType;
  sourceKey: string;
  targetType: KnowledgeEntityType;
  targetKey: string;
  type: KnowledgeRelationType;
  metadata?: Record<string, unknown>;
}

export function dictionaryRelations(dictionary: KnowledgeDictionary): DictionaryRelationDefinition[] {
  const relations: DictionaryRelationDefinition[] = [];
  for (const category of dictionary.entities.CATEGORY ?? []) {
    if (category.parent) relations.push({ sourceType: "CATEGORY", sourceKey: category.key, targetType: "CATEGORY", targetKey: category.parent, type: "IS_A" });
  }
  for (const material of dictionary.entities.MATERIAL ?? []) {
    for (const technique of material.compatibleWith ?? []) relations.push({ sourceType: "MATERIAL", sourceKey: material.key, targetType: "TECHNIQUE", targetKey: technique, type: "COMPATIBLE_WITH" });
    for (const required of material.requires ?? []) relations.push({ sourceType: "MATERIAL", sourceKey: material.key, targetType: "MATERIAL", targetKey: required, type: "REQUIRES" });
  }
  return relations;
}
