import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { normalizeKey } from "./knowledge-graph.utils.js";
import type { KnowledgeEntityType } from "./knowledge-graph.types.js";
import type { ResolvedSemanticConstraint, SemanticQueryRequest, SemanticRecommendation } from "./semantic-query.types.js";

export interface SemanticQueryRepository {
  resolveTerm(term: string, type?: KnowledgeEntityType): Promise<ResolvedSemanticConstraint["entities"]>;
  recommend(input: SemanticQueryRequest, constraints: ResolvedSemanticConstraint[]): Promise<{ products: SemanticRecommendation[]; candidatesEvaluated: number }>;
}

export class PgSemanticQueryRepository implements SemanticQueryRepository {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async resolveTerm(term: string, type?: KnowledgeEntityType) {
    const normalized = normalizeKey(term);
    const values: unknown[] = [normalized];
    const typeClause = type ? (values.push(type), `AND e.type=$${values.length}`) : "";
    const result = await this.pool.query<{ id: string; type: KnowledgeEntityType; key: string; name: string }>(`
      SELECT DISTINCT e.id,e.type,e.key,e.name,
        CASE
          WHEN e.key=$1 THEN 100
          WHEN EXISTS(SELECT 1 FROM kg_aliases a WHERE a.entity_id=e.id AND a.alias_normalized=$1) THEN 90
          WHEN e.key LIKE '%'||$1||'%' THEN 70
          WHEN EXISTS(SELECT 1 FROM kg_aliases a WHERE a.entity_id=e.id AND a.alias_normalized LIKE '%'||$1||'%') THEN 60
          ELSE 40
        END rank
      FROM kg_entities e
      WHERE (e.key=$1 OR e.key LIKE '%'||$1||'%' OR lower(e.name) LIKE '%'||replace($1,'_',' ')||'%'
        OR EXISTS(SELECT 1 FROM kg_aliases a WHERE a.entity_id=e.id AND (a.alias_normalized=$1 OR a.alias_normalized LIKE '%'||$1||'%')))
        ${typeClause}
      ORDER BY rank DESC,e.name
      LIMIT 12`, values);
    return result.rows;
  }

  async recommend(input: SemanticQueryRequest, constraints: ResolvedSemanticConstraint[]) {
    const positive = constraints.filter(item => item.mode !== "EXCLUDE" && item.entityIds.length);
    const must = positive.filter(item => item.mode === "MUST");
    const excludedIds = [...new Set(constraints.filter(item => item.mode === "EXCLUDE").flatMap(item => item.entityIds))];
    const entityModes = new Map<string, "MUST" | "SHOULD">();
    for (const constraint of positive) for (const entityId of constraint.entityIds) {
      if (constraint.mode === "MUST" || !entityModes.has(entityId)) entityModes.set(entityId, constraint.mode as "MUST" | "SHOULD");
    }
    const positiveIds = [...entityModes.keys()];
    if (!positiveIds.length) return this.recommendByText(input);

    const values: unknown[] = [positiveIds, excludedIds, Math.min(Math.max(input.limit ?? 20, 1), 100)];
    const where: string[] = [`p.status=$${values.push(input.status ?? "ACTIVE")}`];
    if (input.providerKey) where.push(`p.provider_key=$${values.push(input.providerKey)}`);
    if (typeof input.customizable === "boolean") where.push(`p.customizable=$${values.push(input.customizable)}`);
    if (excludedIds.length) where.push(`NOT EXISTS(SELECT 1 FROM kg_product_links x WHERE x.canonical_product_id=p.id AND x.entity_id=ANY($2::uuid[]))`);

    const mustGroups = must.map(item => item.entityIds);
    values.push(JSON.stringify(mustGroups));
    const mustGroupsIndex = values.length;

    const result = await this.pool.query(`WITH query_params AS (
      SELECT $2::uuid[] AS excluded_ids
    ), matched AS (
      SELECT p.id,p.provider_key,p.external_id,p.sku,p.name,p.description,p.customizable,
        l.entity_id,l.confidence,e.type,e.key,e.name entity_name
      FROM canonical_products p
      JOIN kg_product_links l ON l.canonical_product_id=p.id AND l.entity_id=ANY($1::uuid[])
      JOIN kg_entities e ON e.id=l.entity_id
      WHERE ${where.join(" AND ")}
    ), grouped AS (
      SELECT id,provider_key,external_id,sku,name,description,customizable,
        count(DISTINCT entity_id)::int matched_entities_count,
        sum(confidence)::numeric confidence_score,
        jsonb_agg(DISTINCT jsonb_build_object('id',entity_id,'type',type,'key',key,'name',entity_name,'confidence',confidence)) entities
      FROM matched GROUP BY id,provider_key,external_id,sku,name,description,customizable
    ), eligible AS (
      SELECT g.* FROM grouped g
      WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements($${mustGroupsIndex}::jsonb) required_group
        WHERE NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(required_group) required_id
          WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(g.entities) actual WHERE actual->>'id'=required_id)
        )
      )
    )
    SELECT *, count(*) OVER()::int total_candidates
    FROM eligible
    ORDER BY matched_entities_count DESC,confidence_score DESC,name
    LIMIT $3`, values);

    const products: SemanticRecommendation[] = result.rows.map(row => {
      const entities = (row.entities as Array<Record<string, unknown>>).map(entity => ({
        id: String(entity.id),
        type: entity.type as KnowledgeEntityType,
        key: String(entity.key),
        name: String(entity.name),
        confidence: Number(entity.confidence),
        mode: entityModes.get(String(entity.id)) ?? "SHOULD",
      }));
      const matchedMust = entities.filter(entity => entity.mode === "MUST").length;
      const matchedShould = entities.filter(entity => entity.mode === "SHOULD").length;
      const score = matchedMust * 100 + matchedShould * 20 + Number(row.confidence_score);
      return {
        id: row.id,
        providerKey: row.provider_key,
        externalId: row.external_id,
        sku: row.sku,
        name: row.name,
        description: row.description,
        customizable: row.customizable,
        score,
        matchedMust,
        matchedShould,
        matchedEntities: entities,
        reasons: entities.map(entity => `${entity.mode === "MUST" ? "Cumple" : "Relacionado con"} ${entity.name} (${entity.type.toLowerCase()})`),
      };
    });
    return { products, candidatesEvaluated: Number(result.rows[0]?.total_candidates ?? 0) };
  }
  private async recommendByText(input: SemanticQueryRequest): Promise<{ products: SemanticRecommendation[]; candidatesEvaluated: number }> {
    const ignored = new Set([
      "a","al","con","de","del","el","en","la","las","los","para","por","que","sin","un","una",
      "dame","necesito","quiero","busco","producto","productos","regalo","regalos","apto","apta","pueda","puede",
      "ser","me","menos","mas","hasta","euro","euros","personalizable","personalizables","ecologico","ecologicos",
      "ecologica","ecologicas"
    ]);
    const tokens = normalizeKey(input.query).split("_")
      .filter(token => token.length >= 3 && !ignored.has(token) && !/^\d+$/.test(token))
      .slice(0, 8);

    const values: unknown[] = [Math.min(Math.max(input.limit ?? 20, 1), 100), input.status ?? "ACTIVE"];
    const where: string[] = [`p.status=$2`];
    if (input.providerKey) where.push(`p.provider_key=$${values.push(input.providerKey)}`);
    if (typeof input.customizable === "boolean") where.push(`p.customizable=$${values.push(input.customizable)}`);

    let relevanceSql = "0";
    if (tokens.length) {
      const clauses: string[] = [];
      for (const token of tokens) {
        const index = values.push(`%${token}%`);
        clauses.push(`CASE WHEN translate(lower(coalesce(p.name,'') || ' ' || coalesce(p.description,'') || ' ' || coalesce(p.material,'') || ' ' || coalesce(p.categories::text,'')), 'áéíóúüñ', 'aeiouun') LIKE $${index} THEN 1 ELSE 0 END`);
      }
      relevanceSql = clauses.join(" + ");
      where.push(`(${clauses.map(clause => clause.replace(/^CASE WHEN /, "").replace(/ THEN 1 ELSE 0 END$/, "")).join(" OR ")})`);
    }

    const result = await this.pool.query(`
      SELECT p.id,p.provider_key,p.external_id,p.sku,p.name,p.description,p.customizable,
        (${relevanceSql})::int text_score, count(*) OVER()::int total_candidates
      FROM canonical_products p
      WHERE ${where.join(" AND ")}
      ORDER BY text_score DESC,p.name
      LIMIT $1`, values);

    const products: SemanticRecommendation[] = result.rows.map(row => ({
      id: row.id, providerKey: row.provider_key, externalId: row.external_id, sku: row.sku,
      name: row.name, description: row.description, customizable: row.customizable,
      score: Number(row.text_score) * 12, matchedMust: 0, matchedShould: 0, matchedEntities: [],
      reasons: Number(row.text_score) > 0 ? [`Coincidencia textual con ${Number(row.text_score)} concepto(s) de la consulta.`] : ["Producto activo compatible con las restricciones generales."],
    }));
    return { products, candidatesEvaluated: Number(result.rows[0]?.total_candidates ?? 0) };
  }

}
