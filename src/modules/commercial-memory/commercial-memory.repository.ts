import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { CommercialFeedbackInput, CommercialMemoryStats, CommercialProductSignal } from "./commercial-memory.types.js";

export interface CommercialMemoryRepository {
  recordRecommendation(request: RecommendationRequest, response: RecommendationResponse): Promise<string>;
  recordFeedback(input: CommercialFeedbackInput): Promise<void>;
  stats(): Promise<CommercialMemoryStats>;
  history(limit: number): Promise<unknown[]>;
  productSignals(productIds: readonly string[], profile?: string): Promise<Map<string, CommercialProductSignal>>;
}

export class PgCommercialMemoryRepository implements CommercialMemoryRepository {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async recordRecommendation(request: RecommendationRequest, response: RecommendationResponse): Promise<string> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const run = await client.query<{ id: string }>(`
        INSERT INTO commercial_recommendation_runs(
          query, profile, pipeline, provider_key, context,
          total_candidates, returned_items, elapsed_ms
        ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
      `, [
        response.query,
        response.profile,
        response.pipeline,
        request.providerKey ?? null,
        request,
        response.totalCandidates,
        response.items.length,
        response.elapsedMs,
      ]);
      const runId = run.rows[0]!.id;
      for (const [index, item] of response.items.entries()) {
        await client.query(`
          INSERT INTO commercial_recommendation_items(
            run_id, product_id, rank, score, outcome, snapshot
          ) VALUES($1,$2,$3,$4,'SHOWN',$5)
          ON CONFLICT(run_id, product_id) DO NOTHING
        `, [runId, item.productId, index + 1, item.score, item]);
      }
      await client.query("COMMIT");
      return runId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async recordFeedback(input: CommercialFeedbackInput): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const item = await client.query<{ id: string }>(`
        SELECT id FROM commercial_recommendation_items
        WHERE run_id=$1 AND product_id=$2
      `, [input.runId, input.productId]);
      if (!item.rows[0]) throw new Error("La recomendación indicada no existe en ese run.");
      await client.query(`
        UPDATE commercial_recommendation_items
        SET outcome=$3,
            feedback=feedback || $4::jsonb,
            updated_at=now()
        WHERE run_id=$1 AND product_id=$2
      `, [input.runId, input.productId, input.eventType, input.metadata ?? {}]);
      await client.query(`
        INSERT INTO commercial_feedback_events(
          run_id,item_id,product_id,event_type,value,notes,actor,metadata
        ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      `, [input.runId, item.rows[0].id, input.productId, input.eventType, input.value ?? null, input.notes ?? null, input.actor ?? null, input.metadata ?? {}]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async stats(): Promise<CommercialMemoryStats> {
    const totals = await this.pool.query(`
      SELECT
        (SELECT count(*)::int FROM commercial_recommendation_runs) runs,
        (SELECT count(*)::int FROM commercial_recommendation_items) recommendations,
        (SELECT count(*)::int FROM commercial_recommendation_items WHERE outcome='SHORTLISTED') shortlisted,
        (SELECT count(*)::int FROM commercial_recommendation_items WHERE outcome='QUOTED') quoted,
        (SELECT count(*)::int FROM commercial_recommendation_items WHERE outcome='ACCEPTED') accepted,
        (SELECT count(*)::int FROM commercial_recommendation_items WHERE outcome='REJECTED') rejected,
        (SELECT count(*)::int FROM commercial_recommendation_items WHERE outcome='PURCHASED') purchased
    `);
    const profile = await this.pool.query(`SELECT profile,count(*)::int count FROM commercial_recommendation_runs GROUP BY profile ORDER BY count DESC`);
    const outcome = await this.pool.query(`SELECT outcome,count(*)::int count FROM commercial_recommendation_items GROUP BY outcome ORDER BY count DESC`);
    const row = totals.rows[0];
    const decided = Number(row.accepted) + Number(row.rejected) + Number(row.purchased);
    const converted = Number(row.accepted) + Number(row.purchased);
    return {
      runs: Number(row.runs), recommendations: Number(row.recommendations), shortlisted: Number(row.shortlisted), quoted: Number(row.quoted), accepted: Number(row.accepted),
      rejected: Number(row.rejected), purchased: Number(row.purchased),
      conversionRate: decided ? Math.round((converted / decided) * 10000) / 100 : 0,
      byProfile: Object.fromEntries(profile.rows.map((x) => [String(x.profile), Number(x.count)])),
      byOutcome: Object.fromEntries(outcome.rows.map((x) => [String(x.outcome), Number(x.count)])),
    };
  }


  async productSignals(productIds: readonly string[], profile?: string): Promise<Map<string, CommercialProductSignal>> {
    if (!productIds.length) return new Map();
    const result = await this.pool.query<{
      product_id: string; event_type: string; count: number; weighted_score: number;
    }>(`
      SELECT e.product_id,
             e.event_type,
             count(*)::int AS count,
             sum(CASE e.event_type
               WHEN 'PURCHASED' THEN 30
               WHEN 'ACCEPTED' THEN 18
               WHEN 'QUOTED' THEN 8
               WHEN 'SHORTLISTED' THEN 4
               WHEN 'REJECTED' THEN -15
               ELSE 0 END)::float8 AS weighted_score
      FROM commercial_feedback_events e
      JOIN commercial_recommendation_runs r ON r.id=e.run_id
      WHERE e.product_id = ANY($1::uuid[])
        AND ($2::text IS NULL OR r.profile=$2 OR r.profile='default')
      GROUP BY e.product_id,e.event_type
    `, [productIds, profile ?? null]);
    const map = new Map<string, CommercialProductSignal>();
    for (const row of result.rows) {
      const current = map.get(row.product_id) ?? { productId: row.product_id, score: 0, evidence: [], counts: {} };
      const count = Number(row.count);
      current.score += Number(row.weighted_score);
      current.counts[row.event_type as keyof typeof current.counts] = count;
      if (row.event_type !== 'SHOWN') current.evidence.push(`${count} ${row.event_type.toLowerCase()}`);
      map.set(row.product_id, current);
    }
    for (const signal of map.values()) signal.score = Math.max(-25, Math.min(35, signal.score));
    return map;
  }

  async history(limit: number): Promise<unknown[]> {
    const result = await this.pool.query(`
      SELECT r.id,r.query,r.profile,r.pipeline,r.provider_key,r.total_candidates,r.returned_items,r.elapsed_ms,r.created_at,
             coalesce(jsonb_agg(jsonb_build_object('productId',i.product_id,'rank',i.rank,'score',i.score,'outcome',i.outcome,'name',i.snapshot->>'name') ORDER BY i.rank) FILTER (WHERE i.id IS NOT NULL),'[]'::jsonb) items
      FROM commercial_recommendation_runs r
      LEFT JOIN commercial_recommendation_items i ON i.run_id=r.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }
}
