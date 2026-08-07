import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import type { ProductBrain } from "../product-brain/product-brain.types.js";
import type { ProductBrainCorrection, ProductBrainHistoryEntry } from "./product-brain-studio.types.js";

export class ProductBrainStudioRepository {
  private initialized = false;
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async ensureSchema(): Promise<void> {
    if (this.initialized) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS canonical_product_brain_overrides (
        product_id uuid PRIMARY KEY REFERENCES canonical_products(id) ON DELETE CASCADE,
        correction jsonb NOT NULL,
        actor text NOT NULL DEFAULT 'admin',
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS canonical_product_brain_history (
        id uuid PRIMARY KEY,
        product_id uuid NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
        action text NOT NULL,
        before_brain jsonb NOT NULL,
        after_brain jsonb NOT NULL,
        correction jsonb NOT NULL,
        actor text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS canonical_product_brain_history_product_idx
        ON canonical_product_brain_history(product_id, created_at DESC);
    `);
    this.initialized = true;
  }

  async getOverride(productId: string): Promise<ProductBrainCorrection | undefined> {
    await this.ensureSchema();
    const result = await this.pool.query(
      `SELECT correction FROM canonical_product_brain_overrides WHERE product_id=$1`,
      [productId],
    );
    return result.rows[0]?.correction as ProductBrainCorrection | undefined;
  }

  async saveOverride(productId: string, correction: ProductBrainCorrection, actor: string): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(`
      INSERT INTO canonical_product_brain_overrides(product_id, correction, actor, updated_at)
      VALUES ($1,$2,$3,now())
      ON CONFLICT(product_id) DO UPDATE SET correction=EXCLUDED.correction, actor=EXCLUDED.actor, updated_at=now()
    `, [productId, correction, actor]);
  }

  async addHistory(input: Omit<ProductBrainHistoryEntry, "id" | "createdAt">): Promise<ProductBrainHistoryEntry> {
    await this.ensureSchema();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await this.pool.query(`
      INSERT INTO canonical_product_brain_history(id,product_id,action,before_brain,after_brain,correction,actor,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [id, input.productId, input.action, input.before, input.after, input.correction, input.actor, createdAt]);
    return Object.freeze({ id, createdAt, ...input });
  }

  async history(productId: string, limit = 30): Promise<ProductBrainHistoryEntry[]> {
    await this.ensureSchema();
    const result = await this.pool.query(`
      SELECT id, product_id, action, before_brain, after_brain, correction, actor, created_at
      FROM canonical_product_brain_history WHERE product_id=$1
      ORDER BY created_at DESC LIMIT $2
    `, [productId, Math.max(1, Math.min(limit, 100))]);
    return result.rows.map((row) => ({
      id: String(row.id), productId: String(row.product_id), action: row.action,
      before: row.before_brain, after: row.after_brain, correction: row.correction,
      actor: String(row.actor), createdAt: new Date(row.created_at).toISOString(),
    })) as ProductBrainHistoryEntry[];
  }

  async historyEntry(id: string): Promise<ProductBrainHistoryEntry | undefined> {
    await this.ensureSchema();
    const result = await this.pool.query(`
      SELECT id, product_id, action, before_brain, after_brain, correction, actor, created_at
      FROM canonical_product_brain_history WHERE id=$1
    `, [id]);
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: String(row.id), productId: String(row.product_id), action: row.action,
      before: row.before_brain, after: row.after_brain, correction: row.correction,
      actor: String(row.actor), createdAt: new Date(row.created_at).toISOString(),
    } as ProductBrainHistoryEntry;
  }
}
