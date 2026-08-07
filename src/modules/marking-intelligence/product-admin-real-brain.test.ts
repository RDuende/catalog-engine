import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

async function pool() {
  const { canonicalPool } = await import(
    "../canonical-catalog/canonical-db.js"
  );

  return canonicalPool();
}

test(
  "la administración usa Product Brain persistido real",
  async () => {
    const db = await pool();

    const brains = await db.query(
      `SELECT count(*)::int AS total
       FROM canonical_product_brains`,
    );

    const products = await db.query(
      `SELECT count(*)::int AS total
       FROM canonical_products`,
    );

    assert.ok(
      Number(products.rows[0]?.total) > 0,
      "canonical_products está vacío",
    );

    assert.ok(
      Number(brains.rows[0]?.total) > 0,
      "canonical_product_brains está vacío",
    );
  },
);

test(
  "Product Brain persistido contiene clasificación utilizable",
  async () => {
    const db = await pool();

    const result = await db.query(`
      SELECT
        count(*) FILTER (
          WHERE nullif(brain->>'objectType','') IS NOT NULL
        )::int AS object_types,

        count(*) FILTER (
          WHERE nullif(brain->>'status','') IS NOT NULL
        )::int AS statuses,

        count(*) FILTER (
          WHERE jsonb_array_length(
            coalesce(brain->'interests','[]'::jsonb)
          ) > 0
        )::int AS interests

      FROM canonical_product_brains
    `);

    assert.ok(
      Number(result.rows[0]?.object_types) > 0,
      "No hay objectType persistidos",
    );

    assert.ok(
      Number(result.rows[0]?.statuses) > 0,
      "No hay status persistidos",
    );

    assert.ok(
      Number(result.rows[0]?.interests) > 0,
      "No hay interests persistidos",
    );
  },
);
