import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { normalizeKey, slugify } from "./knowledge-graph.utils.js";
import type { DictionaryEntity, DictionaryRelationDefinition } from "./knowledge-dictionary.js";
import type { KnowledgeDictionaryRepository } from "./knowledge-dictionary.service.js";
import type { KnowledgeEntityType } from "./knowledge-graph.types.js";

export interface SemanticSearchOptions { q: string; limit?: number; providerKey?: string; }
export interface SemanticKnowledgeRepository {
  search(options: SemanticSearchOptions): Promise<unknown>;
  explore(entityId: string, depth: number, limit: number): Promise<unknown | null>;
  compatible(material: string, technique?: string): Promise<unknown>;
}

export class PgKnowledgeIntelligenceRepository implements KnowledgeDictionaryRepository, SemanticKnowledgeRepository {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async upsertDictionaryEntity(type: KnowledgeEntityType, entity: DictionaryEntity) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query<{ id: string }>(`SELECT id FROM kg_entities WHERE type=$1 AND key=$2`, [type, normalizeKey(entity.key)]);
      const saved = await client.query<{ id: string }>(`INSERT INTO kg_entities(type,key,name,slug,metadata) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(type,key) DO UPDATE SET name=EXCLUDED.name,metadata=kg_entities.metadata||EXCLUDED.metadata,updated_at=CASE WHEN kg_entities.name IS DISTINCT FROM EXCLUDED.name OR kg_entities.metadata IS DISTINCT FROM kg_entities.metadata||EXCLUDED.metadata THEN now() ELSE kg_entities.updated_at END RETURNING id`,
        [type, normalizeKey(entity.key), entity.name, slugify(entity.name), { ...(entity.metadata ?? {}), dictionary: "v0.46.2" }]);
      const id = saved.rows[0]!.id;
      let aliasesCreated = 0;
      for (const alias of new Set([entity.name, ...(entity.aliases ?? [])])) {
        const r = await client.query(`INSERT INTO kg_aliases(entity_id,provider_key,alias,alias_normalized) VALUES($1,'dictionary',$2,$3)
          ON CONFLICT(entity_id,provider_key,alias_normalized) DO NOTHING`, [id, alias, normalizeKey(alias)]);
        aliasesCreated += r.rowCount ?? 0;
      }
      await client.query("COMMIT");
      return { id, created: (existing.rowCount ?? 0) === 0, aliasesCreated };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async upsertDictionaryRelation(relation: DictionaryRelationDefinition) {
    const nodes = await this.pool.query<{ source_id: string; target_id: string }>(`SELECT
      (SELECT id FROM kg_entities WHERE type=$1 AND key=$2) source_id,
      (SELECT id FROM kg_entities WHERE type=$3 AND key=$4) target_id`,
      [relation.sourceType, normalizeKey(relation.sourceKey), relation.targetType, normalizeKey(relation.targetKey)]);
    const row = nodes.rows[0];
    if (!row?.source_id || !row.target_id || row.source_id === row.target_id) return "SKIPPED" as const;
    const existing = await this.pool.query<{ weight: string; confidence: string; metadata: Record<string, unknown> }>(`SELECT weight,confidence,metadata FROM kg_relations WHERE source_id=$1 AND target_id=$2 AND type=$3`, [row.source_id, row.target_id, relation.type]);
    const metadata = { ...(relation.metadata ?? {}), dictionary: "v0.46.2" };
    if (!existing.rows[0]) {
      await this.pool.query(`INSERT INTO kg_relations(source_id,target_id,type,weight,confidence,metadata) VALUES($1,$2,$3,1,1,$4)`, [row.source_id, row.target_id, relation.type, metadata]);
      return "CREATED" as const;
    }
    if (JSON.stringify(existing.rows[0].metadata ?? {}) === JSON.stringify(metadata)) return "UNCHANGED" as const;
    await this.pool.query(`UPDATE kg_relations SET metadata=$4,updated_at=now() WHERE source_id=$1 AND target_id=$2 AND type=$3`, [row.source_id, row.target_id, relation.type, metadata]);
    return "UPDATED" as const;
  }

  async search(options: SemanticSearchOptions) {
    const q = normalizeKey(options.q);
    const tokens = [...new Set(q.split("_").filter(token => token.length > 1))];
    if (!tokens.length) return { query: options.q, matchedEntities: [], products: [] };
    const values: unknown[] = [tokens, Math.min(Math.max(options.limit ?? 25, 1), 100)];
    const providerClause = options.providerKey ? (values.push(options.providerKey), `AND p.provider_key=$${values.length}`) : "";
    const result = await this.pool.query(`WITH matches AS (
      SELECT DISTINCT e.id,e.type,e.key,e.name,
        (CASE WHEN e.key=ANY($1::text[]) THEN 3 ELSE 0 END +
         CASE WHEN EXISTS(SELECT 1 FROM unnest($1::text[]) t WHERE e.key LIKE '%'||t||'%' OR lower(e.name) LIKE '%'||replace(t,'_',' ')||'%') THEN 2 ELSE 0 END +
         CASE WHEN EXISTS(SELECT 1 FROM kg_aliases a, unnest($1::text[]) t WHERE a.entity_id=e.id AND a.alias_normalized LIKE '%'||t||'%') THEN 2 ELSE 0 END) score
      FROM kg_entities e
      WHERE EXISTS(SELECT 1 FROM unnest($1::text[]) t WHERE e.key LIKE '%'||t||'%' OR lower(e.name) LIKE '%'||replace(t,'_',' ')||'%')
         OR EXISTS(SELECT 1 FROM kg_aliases a, unnest($1::text[]) t WHERE a.entity_id=e.id AND a.alias_normalized LIKE '%'||t||'%')
    ), ranked AS (
      SELECT p.id,p.provider_key,p.external_id,p.sku,p.name,p.description,
        count(DISTINCT l.entity_id)::int matched_count,
        sum(m.score*l.confidence)::numeric score,
        json_agg(DISTINCT jsonb_build_object('id',m.id,'type',m.type,'key',m.key,'name',m.name,'confidence',l.confidence)) matched_entities
      FROM canonical_products p JOIN kg_product_links l ON l.canonical_product_id=p.id JOIN matches m ON m.id=l.entity_id
      WHERE 1=1 ${providerClause}
      GROUP BY p.id
    ) SELECT * FROM ranked ORDER BY matched_count DESC,score DESC,name LIMIT $2`, values);
    const entities = await this.pool.query(`SELECT DISTINCT e.id,e.type,e.key,e.name FROM kg_entities e WHERE EXISTS(SELECT 1 FROM unnest($1::text[]) t WHERE e.key LIKE '%'||t||'%' OR lower(e.name) LIKE '%'||replace(t,'_',' ')||'%') OR EXISTS(SELECT 1 FROM kg_aliases a, unnest($1::text[]) t WHERE a.entity_id=e.id AND a.alias_normalized LIKE '%'||t||'%') ORDER BY e.type,e.name`, [tokens]);
    return { query: options.q, normalizedQuery: q, matchedEntities: entities.rows, products: result.rows.map(r => ({ ...r, score: Number(r.score) })) };
  }

  async explore(entityId: string, depth: number, limit: number) {
    const entity = await this.pool.query(`SELECT * FROM kg_entities WHERE id=$1`, [entityId]);
    if (!entity.rows[0]) return null;
    const result = await this.pool.query(`WITH RECURSIVE graph AS (
      SELECT r.source_id,r.target_id,r.type,r.weight,r.confidence,1 depth FROM kg_relations r WHERE r.source_id=$1 OR r.target_id=$1
      UNION ALL
      SELECT r.source_id,r.target_id,r.type,r.weight,r.confidence,g.depth+1 FROM kg_relations r JOIN graph g ON (r.source_id=g.target_id OR r.target_id=g.source_id) WHERE g.depth<$2
    ) SELECT * FROM graph LIMIT $3`, [entityId, Math.min(Math.max(depth, 1), 4), Math.min(Math.max(limit, 1), 500)]);
    const ids = [...new Set([entityId, ...result.rows.flatMap(r => [r.source_id, r.target_id])])];
    const nodes = await this.pool.query(`SELECT id,type,key,name,slug,metadata FROM kg_entities WHERE id=ANY($1::uuid[])`, [ids]);
    return { root: entity.rows[0], nodes: nodes.rows, edges: result.rows };
  }

  async compatible(material: string, technique?: string) {
    const materialKey = normalizeKey(material);
    const techniqueKey = technique ? normalizeKey(technique) : undefined;
    const values: unknown[] = [materialKey];
    let filter = "";
    if (techniqueKey) { values.push(techniqueKey); filter = `AND t.key=$${values.length}`; }
    const result = await this.pool.query(`SELECT m.id material_id,m.key material_key,m.name material_name,t.id technique_id,t.key technique_key,t.name technique_name,r.confidence,r.weight
      FROM kg_relations r JOIN kg_entities m ON m.id=r.source_id AND m.type='MATERIAL' JOIN kg_entities t ON t.id=r.target_id AND t.type='TECHNIQUE'
      WHERE r.type='COMPATIBLE_WITH' AND (m.key=$1 OR EXISTS(SELECT 1 FROM kg_aliases a WHERE a.entity_id=m.id AND a.alias_normalized=$1)) ${filter}
      ORDER BY r.weight DESC,t.name`, values);
    return { material, technique: technique ?? null, compatible: result.rows };
  }
}
