import "dotenv/config";
import { canonicalPool } from "./src/modules/canonical-catalog/canonical-db.ts";

const pool = canonicalPool();

const columns = await pool.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'canonical_products'
  ORDER BY ordinal_position
`);

console.log("\n=== COLUMNAS canonical_products ===");
console.table(columns.rows);

const products = await pool.query(`
  SELECT *
  FROM canonical_products
  LIMIT 5
`);

console.log("\n=== 5 PRODUCTOS CANONICOS ===");
console.dir(products.rows, { depth: 5 });

const brains = await pool.query(`
  SELECT product_id, brain
  FROM canonical_product_brains
  LIMIT 5
`);

console.log("\n=== 5 PRODUCT BRAINS ===");
console.dir(brains.rows, { depth: 8 });

await pool.end();
