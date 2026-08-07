import "dotenv/config";

import assert from "node:assert/strict";
import test from "node:test";

async function db() {
  const { canonicalPool } = await import(
    "../canonical-catalog/canonical-db.js"
  );

  return canonicalPool();
}

test(
  "canonical_products y canonical_product_brains se unen por UUID",
  async () => {
    const pool = await db();

    const result = await pool.query(`
      SELECT
        (SELECT count(*)::int
         FROM canonical_products) AS products,

        (SELECT count(*)::int
         FROM canonical_product_brains) AS brains,

        (
          SELECT count(*)::int
          FROM canonical_products p
          INNER JOIN canonical_product_brains b
            ON b.product_id = p.id
        ) AS joined
    `);

    const row = result.rows[0];

    assert.ok(Number(row.products) > 0);
    assert.ok(Number(row.brains) > 0);

    assert.equal(
      Number(row.joined),
      Number(row.brains),
      "Hay Product Brain sin canonical_product asociado",
    );
  },
);

test(
  "el JOIN expone external_id, material, objectType y estados reales",
  async () => {
    const pool = await db();

    const result = await pool.query(`
      SELECT
        count(*) FILTER (
          WHERE p.provider_key = 'makito'
            AND nullif(p.external_id, '') IS NOT NULL
        )::int AS makito_ids,

        count(*) FILTER (
          WHERE nullif(p.material, '') IS NOT NULL
        )::int AS materials,

        count(*) FILTER (
          WHERE nullif(b.brain->>'objectType', '') IS NOT NULL
        )::int AS object_types,

        count(*) FILTER (
          WHERE b.brain->>'status' = 'READY'
        )::int AS ready,

        count(*) FILTER (
          WHERE b.brain->>'status' = 'REVIEW_REQUIRED'
        )::int AS review_required

      FROM canonical_products p
      INNER JOIN canonical_product_brains b
        ON b.product_id = p.id
    `);

    const row = result.rows[0];

    assert.ok(Number(row.makito_ids) > 0);
    assert.ok(Number(row.materials) > 0);
    assert.ok(Number(row.object_types) > 0);
    assert.ok(Number(row.ready) > 0);
    assert.ok(Number(row.review_required) > 0);
  },
);
