import { Pool } from "pg";

let pool: Pool | undefined;
export function canonicalPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL para utilizar el catálogo canónico.");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}
