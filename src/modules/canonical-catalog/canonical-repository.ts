import type { Pool, PoolClient } from "pg";
import { canonicalPool } from "./canonical-db.js";
import { canonicalProductHash } from "./canonical-hash.js";
import type { CanonicalImportResult, CanonicalProductInput, CanonicalUpsertResult } from "./canonical-types.js";

export class CanonicalCatalogRepository {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async upsert(product: CanonicalProductInput): Promise<CanonicalUpsertResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await this.upsertWithClient(client, product);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async import(products: CanonicalProductInput[]): Promise<CanonicalImportResult> {
    const summary: CanonicalImportResult = { received: products.length, created: 0, updated: 0, unchanged: 0, failed: 0, results: [], errors: [] };
    for (const product of products) {
      try {
        const result = await this.upsert(product);
        summary.results.push(result);
        if (result.action === "CREATED") summary.created += 1;
        else if (result.action === "UPDATED") summary.updated += 1;
        else summary.unchanged += 1;
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({ externalId: product.externalId, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return summary;
  }

  private async upsertWithClient(client: PoolClient, product: CanonicalProductInput): Promise<CanonicalUpsertResult> {
    const hash = canonicalProductHash(product);
    const existing = await client.query<{ id: string; content_hash: string }>(
      `SELECT id, content_hash FROM canonical_products WHERE provider_key=$1 AND external_id=$2 FOR UPDATE`,
      [product.providerKey, product.externalId]
    );
    if (existing.rows[0]?.content_hash === hash) {
      await client.query(`UPDATE canonical_products SET last_seen_at=now() WHERE id=$1`, [existing.rows[0].id]);
      return { id: existing.rows[0].id, providerKey: product.providerKey, externalId: product.externalId, action: "UNCHANGED", contentHash: hash };
    }

    const action: "UPDATED" | "CREATED" = (existing.rowCount ?? 0) > 0 ? "UPDATED" : "CREATED";
    const saved = await client.query<{ id: string }>(`
      INSERT INTO canonical_products (
        provider_key, external_id, sku, name, description, short_description, brand, material, color,
        dimensions, weight, customizable, status, source_updated_at, categories, tags, attributes,
        metadata, content_hash, first_seen_at, last_seen_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now(),now(),now())
      ON CONFLICT (provider_key, external_id) DO UPDATE SET
        sku=EXCLUDED.sku, name=EXCLUDED.name, description=EXCLUDED.description,
        short_description=EXCLUDED.short_description, brand=EXCLUDED.brand, material=EXCLUDED.material,
        color=EXCLUDED.color, dimensions=EXCLUDED.dimensions, weight=EXCLUDED.weight,
        customizable=EXCLUDED.customizable, status=EXCLUDED.status, source_updated_at=EXCLUDED.source_updated_at,
        categories=EXCLUDED.categories, tags=EXCLUDED.tags, attributes=EXCLUDED.attributes,
        metadata=EXCLUDED.metadata, content_hash=EXCLUDED.content_hash, last_seen_at=now(), updated_at=now()
      RETURNING id`, [
        product.providerKey, product.externalId, product.sku ?? null, product.name, product.description ?? null,
        product.shortDescription ?? null, product.brand ?? null, product.material ?? null, product.color ?? null,
        product.dimensions ?? null, product.weight ?? null, product.customizable ?? false, product.status ?? "ACTIVE",
        product.sourceUpdatedAt ? new Date(product.sourceUpdatedAt) : null, product.categories ?? [], product.tags ?? [],
        product.attributes ?? {}, product.metadata ?? {}, hash
      ]);
    const savedRow = saved.rows[0];
    if (!savedRow) throw new Error("La base de datos no devolvió el producto guardado.");
    const id = savedRow.id;
    await client.query(`DELETE FROM canonical_variants WHERE product_id=$1`, [id]);
    await client.query(`DELETE FROM canonical_media WHERE product_id=$1`, [id]);
    for (const variant of product.variants ?? []) {
      await client.query(`INSERT INTO canonical_variants
        (product_id, external_id, sku, name, barcode, color, size, material, active, metadata)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [id, variant.externalId ?? null, variant.sku, variant.name ?? null,
        variant.barcode ?? null, variant.color ?? null, variant.size ?? null, variant.material ?? null, variant.active ?? true, variant.metadata ?? {}]);
    }
    for (const medium of product.media ?? []) {
      await client.query(`INSERT INTO canonical_media
        (product_id, url, type, alt_text, is_primary, position, metadata)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, medium.url, medium.type ?? "IMAGE", medium.altText ?? null,
        medium.isPrimary ?? false, medium.position ?? 0, medium.metadata ?? {}]);
    }
    await client.query(`INSERT INTO canonical_product_revisions (product_id, action, content_hash, snapshot)
      VALUES ($1,$2,$3,$4)`, [id, action, hash, product]);
    return { id, providerKey: product.providerKey, externalId: product.externalId, action, contentHash: hash };
  }

  async list(options: { providerKey?: string; status?: string; q?: string; limit?: number; offset?: number }) {
    const values: unknown[] = [];
    const where: string[] = [];
    if (options.providerKey) { values.push(options.providerKey); where.push(`p.provider_key=$${values.length}`); }
    if (options.status) { values.push(options.status); where.push(`p.status=$${values.length}`); }
    if (options.q) { values.push(`%${options.q}%`); where.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length} OR p.external_id ILIKE $${values.length})`); }
    values.push(Math.min(Math.max(options.limit ?? 50, 1), 250)); const limitIndex = values.length;
    values.push(Math.max(options.offset ?? 0, 0)); const offsetIndex = values.length;
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await this.pool.query(`SELECT p.*,
      COALESCE((SELECT json_agg(v ORDER BY v.sku) FROM canonical_variants v WHERE v.product_id=p.id),'[]') variants,
      COALESCE((SELECT json_agg(m ORDER BY m.position) FROM canonical_media m WHERE m.product_id=p.id),'[]') media
      FROM canonical_products p ${clause} ORDER BY p.updated_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`, values);
    return result.rows;
  }

  async stats() {
    const result = await this.pool.query(`SELECT
      count(*)::int products,
      count(*) FILTER (WHERE status='ACTIVE')::int active,
      count(DISTINCT provider_key)::int providers,
      (SELECT count(*)::int FROM canonical_variants) variants,
      (SELECT count(*)::int FROM canonical_media) media,
      max(updated_at) last_update
      FROM canonical_products`);
    return result.rows[0];
  }
}
