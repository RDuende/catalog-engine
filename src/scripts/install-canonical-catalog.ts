import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const sql = await readFile(resolve("sql/0042-canonical-catalog.sql"), "utf8");
  await pool.query(sql);
  console.log("Catálogo canónico instalado correctamente.");
} finally { await pool.end(); }
