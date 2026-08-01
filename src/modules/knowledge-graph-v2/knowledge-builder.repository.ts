import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { normalizeKey, slugify } from "./knowledge-graph.utils.js";
import type { CanonicalKnowledgeProduct, DetectedKnowledge, KnowledgeBuildOptions, KnowledgeBuildResult, KnowledgeBuilderRepository } from "./knowledge-builder.types.js";
import type { ProductKnowledgeRelation } from "./knowledge-graph.types.js";

export class PgKnowledgeBuilderRepository implements KnowledgeBuilderRepository {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  private where(options: KnowledgeBuildOptions, values: unknown[]) {
    const clauses: string[] = [];
    if (options.providerKey) { values.push(options.providerKey); clauses.push(`p.provider_key=$${values.length}`); }
    if (options.productIds?.length) { values.push(options.productIds); clauses.push(`p.id=ANY($${values.length}::uuid[])`); }
    return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  }

  async countProducts(options: KnowledgeBuildOptions) {
    const values: unknown[] = [];
    const result = await this.pool.query<{ count: number }>(`SELECT count(*)::int count FROM canonical_products p ${this.where(options, values)}`, values);
    return result.rows[0]?.count ?? 0;
  }

  async listProducts(options: KnowledgeBuildOptions & { offset: number; limit: number }): Promise<CanonicalKnowledgeProduct[]> {
    const values: unknown[] = [];
    const where = this.where(options, values);
    values.push(options.limit); const limitIndex = values.length;
    values.push(options.offset); const offsetIndex = values.length;
    const result = await this.pool.query(`SELECT p.*,
      COALESCE((SELECT json_agg(json_build_object('material',v.material,'color',v.color,'size',v.size,'metadata',v.metadata)) FROM canonical_variants v WHERE v.product_id=p.id),'[]') variants
      FROM canonical_products p ${where} ORDER BY p.id LIMIT $${limitIndex} OFFSET $${offsetIndex}`, values);
    return result.rows.map(row => ({
      id: row.id, providerKey: row.provider_key, externalId: row.external_id, sku: row.sku, name: row.name,
      description: row.description, shortDescription: row.short_description, brand: row.brand, material: row.material,
      color: row.color, dimensions: row.dimensions, weight: row.weight == null ? null : Number(row.weight), customizable: row.customizable,
      categories: row.categories ?? [], tags: row.tags ?? [], attributes: row.attributes ?? {}, metadata: row.metadata ?? {}, variants: row.variants ?? [],
    }));
  }

  async upsertDetectedEntity(input: DetectedKnowledge, providerKey: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query<{ id: string }>(`SELECT id FROM kg_entities WHERE type=$1 AND key=$2`, [input.type, normalizeKey(input.key)]);
      const result = await client.query<{ id: string }>(`INSERT INTO kg_entities(type,key,name,slug,metadata) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(type,key) DO UPDATE SET name=EXCLUDED.name,metadata=kg_entities.metadata||EXCLUDED.metadata,updated_at=now() RETURNING id`,
        [input.type, normalizeKey(input.key), input.name, slugify(input.name), { ...input.metadata, builder: "v0.46.1" }]);
      const entityId = result.rows[0]!.id;
      let aliasUpserted = false;
      for (const alias of new Set([input.name, ...input.aliases])) {
        if (!alias.trim()) continue;
        const aliasResult = await client.query(`INSERT INTO kg_aliases(entity_id,provider_key,alias,alias_normalized)
          VALUES($1,$2,$3,$4) ON CONFLICT(entity_id,provider_key,alias_normalized) DO NOTHING`, [entityId, providerKey, alias, normalizeKey(alias)]);
        aliasUpserted ||= (aliasResult.rowCount ?? 0) > 0;
      }
      await client.query("COMMIT");
      return { id: entityId, created: (existing.rowCount ?? 0) === 0, aliasUpserted };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async upsertProductLink(input: { productId: string; entityId: string; relationType: ProductKnowledgeRelation; confidence: number; source: "PROVIDER" | "INFERRED" | "AI" | "MANUAL"; metadata?: Record<string, unknown> }) {
    const metadata = input.metadata ?? {};
    const result = await this.pool.query<{ status: "CREATED" | "UPDATED" | "UNCHANGED" }>(`
      WITH inserted AS (
        INSERT INTO kg_product_links(
          canonical_product_id, entity_id, relation_type, source, confidence, metadata
        )
        VALUES($1,$2,$3,$4,$5,$6::jsonb)
        ON CONFLICT(canonical_product_id,entity_id,relation_type) DO NOTHING
        RETURNING 'CREATED'::text AS status
      ), updated AS (
        UPDATE kg_product_links
        SET source=$4, confidence=$5, metadata=$6::jsonb, updated_at=now()
        WHERE canonical_product_id=$1
          AND entity_id=$2
          AND relation_type=$3
          AND NOT EXISTS (SELECT 1 FROM inserted)
          AND (
            source IS DISTINCT FROM $4
            OR confidence IS DISTINCT FROM $5::numeric
            OR metadata IS DISTINCT FROM $6::jsonb
          )
        RETURNING 'UPDATED'::text AS status
      )
      SELECT status FROM inserted
      UNION ALL
      SELECT status FROM updated
      UNION ALL
      SELECT 'UNCHANGED'::text AS status
      WHERE NOT EXISTS (SELECT 1 FROM inserted)
        AND NOT EXISTS (SELECT 1 FROM updated)
      LIMIT 1
    `, [input.productId, input.entityId, input.relationType, input.source, input.confidence, JSON.stringify(metadata)]);
    return result.rows[0]?.status ?? "UNCHANGED";
  }

  async removeStaleAutoLinks(productId: string, retainedEntityIds: string[]) {
    const result = retainedEntityIds.length
      ? await this.pool.query(`DELETE FROM kg_product_links WHERE canonical_product_id=$1 AND source IN ('PROVIDER','INFERRED') AND NOT(entity_id=ANY($2::uuid[]))`, [productId, retainedEntityIds])
      : await this.pool.query(`DELETE FROM kg_product_links WHERE canonical_product_id=$1 AND source IN ('PROVIDER','INFERRED')`, [productId]);
    return result.rowCount ?? 0;
  }

  async startBuild(options: KnowledgeBuildOptions) {
    const result = await this.pool.query<{ id: string }>(`INSERT INTO kg_build_runs(status,provider_key,options) VALUES('RUNNING',$1,$2) RETURNING id`, [options.providerKey ?? null, options]);
    return result.rows[0]?.id;
  }

  async finishBuild(runId: string | undefined, result: KnowledgeBuildResult, status: "COMPLETED" | "FAILED") {
    if (!runId) return;
    await this.pool.query(`UPDATE kg_build_runs SET status=$2,result=$3,finished_at=now() WHERE id=$1`, [runId, status, result]);
  }
}
