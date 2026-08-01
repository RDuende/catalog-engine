import type { Pool } from "pg";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";

export interface RecommendationProductRecord {
  id: string;
  providerKey: string;
  externalId: string;
  sku: string | null;
  name: string;
  description: string | null;
  shortDescription: string | null;
  material: string | null;
  customizable: boolean;
  categories: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface RecommendationRepository {
  findByIds(ids: readonly string[]): Promise<RecommendationProductRecord[]>;
}

export class PgRecommendationRepository implements RecommendationRepository {
  constructor(private readonly pool: Pool = canonicalPool()) {}

  async findByIds(ids: readonly string[]): Promise<RecommendationProductRecord[]> {
    if (!ids.length) return [];
    const result = await this.pool.query(`
      SELECT id, provider_key, external_id, sku, name, description, short_description,
             material, customizable, categories, tags, attributes, metadata
      FROM canonical_products
      WHERE id = ANY($1::uuid[])
    `, [ids]);

    return result.rows.map((row) => ({
      id: row.id,
      providerKey: row.provider_key,
      externalId: row.external_id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      shortDescription: row.short_description,
      material: row.material,
      customizable: Boolean(row.customizable),
      categories: Array.isArray(row.categories) ? row.categories.map(String) : [],
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      attributes: asRecord(row.attributes),
      metadata: asRecord(row.metadata),
    }));
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
