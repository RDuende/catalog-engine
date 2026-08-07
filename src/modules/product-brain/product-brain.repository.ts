import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import { classifyProductBrain } from "./product-brain.classifier.js";
import type { ProductBrain, ProductBrainSource } from "./product-brain.types.js";

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sourceFromRow(row: Record<string, unknown>): ProductBrainSource {
  return {
    id: String(row.id),
    providerKey: String(row.provider_key ?? "unknown"),
    name: String(row.name ?? "Producto sin nombre"),
    ...(typeof row.description === "string" ? { description: row.description } : {}),
    ...(typeof row.short_description === "string" ? { shortDescription: row.short_description } : {}),
    categories: Object.freeze(stringArray(row.categories)),
    tags: Object.freeze(stringArray(row.tags)),
    ...(typeof row.material === "string" ? { material: row.material } : {}),
    customizable: row.customizable === true,
    attributes: record(row.attributes),
    metadata: record(row.metadata),
  };
}

export class ProductBrainRepository {
  private initialized = false;

  constructor(private readonly pool: Pool = canonicalPool()) {}

  async ensureSchema(): Promise<void> {
    if (this.initialized) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS canonical_product_brains (
        product_id uuid PRIMARY KEY REFERENCES canonical_products(id) ON DELETE CASCADE,
        version text NOT NULL,
        status text NOT NULL,
        brain jsonb NOT NULL,
        source_content_hash text,
        generated_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS canonical_product_brains_status_idx ON canonical_product_brains(status);
      CREATE INDEX IF NOT EXISTS canonical_product_brains_brain_gin_idx ON canonical_product_brains USING gin(brain);
    `);
    this.initialized = true;
  }

  async save(brain: ProductBrain, sourceContentHash?: string): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(`
      INSERT INTO canonical_product_brains(product_id, version, status, brain, source_content_hash, generated_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,now())
      ON CONFLICT(product_id) DO UPDATE SET
        version=EXCLUDED.version,
        status=EXCLUDED.status,
        brain=EXCLUDED.brain,
        source_content_hash=EXCLUDED.source_content_hash,
        generated_at=EXCLUDED.generated_at,
        updated_at=now()
    `, [brain.productId, brain.version, brain.status, brain, sourceContentHash ?? null, brain.generatedAt]);
  }

  async classify(options: { providerKey?: string; limit?: number; force?: boolean; onProgress?: (completed: number, total: number) => void } = {}): Promise<{ scanned: number; classified: number; skipped: number; reviewRequired: number }> {
    await this.ensureSchema();
    const values: unknown[] = [];
    const where = ["p.status='ACTIVE'"];
    if (options.providerKey) { values.push(options.providerKey); where.push(`p.provider_key=$${values.length}`); }
    if (!options.force) where.push("(b.product_id IS NULL OR b.source_content_hash IS DISTINCT FROM p.content_hash)");
    values.push(Math.max(1, Math.min(options.limit ?? 1000, 100000)));
    const result = await this.pool.query(`
      SELECT p.* FROM canonical_products p
      LEFT JOIN canonical_product_brains b ON b.product_id=p.id
      WHERE ${where.join(" AND ")}
      ORDER BY p.updated_at ASC
      LIMIT $${values.length}
    `, values);
    let classified = 0;
    let reviewRequired = 0;
    for (const row of result.rows as Record<string, unknown>[]) {
      const brain = classifyProductBrain(sourceFromRow(row));
      await this.save(brain, typeof row.content_hash === "string" ? row.content_hash : undefined);
      classified += 1;
      if (brain.status === "REVIEW_REQUIRED") reviewRequired += 1;
      options.onProgress?.(classified, result.rowCount ?? 0);
    }
    return { scanned: result.rowCount ?? 0, classified, skipped: 0, reviewRequired };
  }

  async stats(): Promise<Record<string, number>> {
    await this.ensureSchema();
    const result = await this.pool.query(`SELECT
      count(*)::int total,
      count(*) FILTER (WHERE status='READY')::int ready,
      count(*) FILTER (WHERE status='REVIEW_REQUIRED')::int review_required
      FROM canonical_product_brains`);
    return result.rows[0] ?? { total: 0, ready: 0, review_required: 0 };
  }
}
