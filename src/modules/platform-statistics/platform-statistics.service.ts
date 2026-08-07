import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { catalogImportService } from "../catalog-import/catalog-import.service.js";

export interface PlatformStatisticsSnapshot {
  readonly generatedAt: string;
  readonly catalog: Record<string, unknown>;
  readonly productBrain: Record<string, unknown>;
  readonly media: Record<string, unknown>;
  readonly knowledge: Record<string, unknown>;
  readonly recommendations: Record<string, unknown>;
  readonly imports: Record<string, unknown>;
  readonly quality: Record<string, unknown>;
}

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>("SELECT to_regclass($1) IS NOT NULL AS exists", [`public.${table}`]);
  return result.rows[0]?.exists === true;
}

async function directoryMetrics(root: string): Promise<{ files: number; bytes: number }> {
  let files = 0;
  let bytes = 0;
  async function walk(directory: string): Promise<void> {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        files += 1;
        try { bytes += (await stat(path)).size; } catch { /* El archivo pudo cambiar durante la lectura. */ }
      }
    }
  }
  await walk(root);
  return { files, bytes };
}

function grouped(rows: readonly Record<string, unknown>[], key: string, value = "count"): Record<string, number> {
  return Object.fromEntries(rows.map(row => [String(row[key] ?? "unknown"), Number(row[value] ?? 0)]));
}

export class PlatformStatisticsService {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async snapshot(): Promise<PlatformStatisticsSnapshot> {
    const catalogResult = await this.pool.query(`SELECT
      count(*)::int products,
      count(*) FILTER (WHERE status='ACTIVE')::int active,
      count(*) FILTER (WHERE status<>'ACTIVE')::int inactive,
      count(*) FILTER (WHERE customizable=true)::int customizable,
      count(DISTINCT provider_key)::int providers,
      count(*) FILTER (WHERE description IS NULL OR btrim(description)='')::int missing_descriptions,
      count(*) FILTER (WHERE coalesce(array_length(categories,1),0)=0)::int missing_categories,
      max(updated_at) last_update
      FROM canonical_products`);
    const providerRows = await this.pool.query(`SELECT provider_key,count(*)::int count FROM canonical_products GROUP BY provider_key ORDER BY count DESC`);
    const variants = await this.pool.query(`SELECT count(*)::int count FROM canonical_variants`);
    const mediaDb = await this.pool.query(`SELECT
      count(*)::int total,
      count(*) FILTER (WHERE url LIKE '/api/v1/catalog-media/%')::int local,
      count(*) FILTER (WHERE url LIKE 'http%')::int remote,
      count(DISTINCT product_id)::int products_with_media
      FROM canonical_media`);
    const productsWithoutMedia = await this.pool.query(`SELECT count(*)::int count FROM canonical_products p WHERE NOT EXISTS(SELECT 1 FROM canonical_media m WHERE m.product_id=p.id)`);

    const brainExists = await tableExists(this.pool, "canonical_product_brains");
    let productBrain: Record<string, unknown> = { total: 0, ready: 0, reviewRequired: 0, coveragePercent: 0, byObjectType: {}, byRole: {}, byInterest: {} };
    if (brainExists) {
      const brain = await this.pool.query(`SELECT count(*)::int total,
        count(*) FILTER(WHERE status='READY')::int ready,
        count(*) FILTER(WHERE status='REVIEW_REQUIRED')::int review_required,
        avg((brain->>'classificationConfidence')::numeric)::float average_confidence,
        avg((brain->>'personalizationScore')::numeric)::float average_personalization,
        avg((brain->>'giftSuitabilityScore')::numeric)::float average_gift_suitability
        FROM canonical_product_brains`);
      const objects = await this.pool.query(`SELECT coalesce(brain->>'objectType','unknown') key,count(*)::int count FROM canonical_product_brains GROUP BY 1 ORDER BY count DESC LIMIT 15`);
      const roles = await this.pool.query(`SELECT role key,count(*)::int count FROM canonical_product_brains, jsonb_array_elements_text(coalesce(brain->'giftRoles','[]'::jsonb)) role GROUP BY role ORDER BY count DESC`);
      const interests = await this.pool.query(`SELECT interest->>'id' key,count(*)::int count FROM canonical_product_brains, jsonb_array_elements(coalesce(brain->'interests','[]'::jsonb)) interest GROUP BY 1 ORDER BY count DESC LIMIT 15`);
      const row = brain.rows[0] ?? {};
      const products = Number(catalogResult.rows[0]?.products ?? 0);
      productBrain = {
        total: Number(row.total ?? 0), ready: Number(row.ready ?? 0), reviewRequired: Number(row.review_required ?? 0),
        coveragePercent: products ? Math.round(Number(row.total ?? 0) / products * 10000) / 100 : 0,
        averageConfidence: Number(row.average_confidence ?? 0), averagePersonalization: Number(row.average_personalization ?? 0),
        averageGiftSuitability: Number(row.average_gift_suitability ?? 0), byObjectType: grouped(objects.rows, "key"),
        byRole: grouped(roles.rows, "key"), byInterest: grouped(interests.rows, "key"),
      };
    }

    const mediaFiles = await directoryMetrics(process.env.CATALOG_MEDIA_ROOT ?? ".data/catalog-media");

    const kgExists = await tableExists(this.pool, "kg_entities");
    let knowledge: Record<string, unknown> = { entities: 0, relations: 0, productLinks: 0, aliases: 0, byType: {} };
    if (kgExists) {
      const totals = await this.pool.query(`SELECT
        (SELECT count(*)::int FROM kg_entities) entities,
        (SELECT count(*)::int FROM kg_relations) relations,
        (SELECT count(*)::int FROM kg_product_links) product_links,
        (SELECT count(*)::int FROM kg_aliases) aliases`);
      const types = await this.pool.query(`SELECT type,count(*)::int count FROM kg_entities GROUP BY type ORDER BY count DESC`);
      knowledge = { ...totals.rows[0], productLinks: totals.rows[0]?.product_links ?? 0, byType: grouped(types.rows, "type") };
    }

    const commercialExists = await tableExists(this.pool, "commercial_recommendation_items");
    let recommendations: Record<string, unknown> = { runs: 0, recommendations: 0, shortlisted: 0, quoted: 0, accepted: 0, rejected: 0, purchased: 0, conversionPercent: 0 };
    if (commercialExists) {
      const rec = await this.pool.query(`SELECT
        (SELECT count(*)::int FROM commercial_recommendation_runs) runs,
        count(*)::int recommendations,
        count(*) FILTER(WHERE outcome='SHORTLISTED')::int shortlisted,
        count(*) FILTER(WHERE outcome='QUOTED')::int quoted,
        count(*) FILTER(WHERE outcome='ACCEPTED')::int accepted,
        count(*) FILTER(WHERE outcome='REJECTED')::int rejected,
        count(*) FILTER(WHERE outcome='PURCHASED')::int purchased
        FROM commercial_recommendation_items`);
      const row = rec.rows[0] ?? {};
      recommendations = { ...row, conversionPercent: Number(row.recommendations) ? Math.round(Number(row.purchased) / Number(row.recommendations) * 10000) / 100 : 0 };
    }

    const jobs = await catalogImportService.list();
    const completed = jobs.filter(job => job.status === "COMPLETED");
    const failed = jobs.filter(job => job.status === "FAILED");
    const running = jobs.filter(job => job.status === "RUNNING" || job.status === "QUEUED");
    const durations = completed.map(job => job.startedAt && job.finishedAt ? new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime() : 0).filter(value => value > 0);
    const imports = {
      total: jobs.length, completed: completed.length, failed: failed.length, running: running.length,
      successPercent: jobs.length ? Math.round(completed.length / jobs.length * 10000) / 100 : 0,
      averageDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      latest: jobs.slice(0, 10).map(job => ({ id: job.id, provider: job.provider, status: job.status, createdAt: job.createdAt, finishedAt: job.finishedAt, progress: job.progress })),
    };

    const catalog = { ...catalogResult.rows[0], variants: variants.rows[0]?.count ?? 0, byProvider: grouped(providerRows.rows, "provider_key") };
    const media = { ...mediaDb.rows[0], productsWithoutMedia: productsWithoutMedia.rows[0]?.count ?? 0, localFiles: mediaFiles.files, localBytes: mediaFiles.bytes };
    const products = Number(catalogResult.rows[0]?.products ?? 0);
    const quality = {
      descriptionCoveragePercent: products ? Math.round((products - Number(catalogResult.rows[0]?.missing_descriptions ?? 0)) / products * 10000) / 100 : 0,
      categoryCoveragePercent: products ? Math.round((products - Number(catalogResult.rows[0]?.missing_categories ?? 0)) / products * 10000) / 100 : 0,
      mediaCoveragePercent: products ? Math.round(Number(mediaDb.rows[0]?.products_with_media ?? 0) / products * 10000) / 100 : 0,
      localMediaPercent: Number(mediaDb.rows[0]?.total ?? 0) ? Math.round(Number(mediaDb.rows[0]?.local ?? 0) / Number(mediaDb.rows[0]?.total ?? 0) * 10000) / 100 : 0,
      brainCoveragePercent: productBrain.coveragePercent,
    };

    return { generatedAt: new Date().toISOString(), catalog, productBrain, media, knowledge, recommendations, imports, quality };
  }
}
