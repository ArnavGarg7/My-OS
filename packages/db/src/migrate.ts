import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadRootEnv, parseServerEnv } from "@myos/shared/env";

loadRootEnv();

/**
 * Migration runner (04 §11 — runs on web container start, advisory-locked).
 * Also ensures the required Postgres extensions exist (05 §0 / §14): pgvector
 * for embeddings, pg_trgm + citext for search/identifiers. Extension setup is
 * idempotent and centralized here so CI and every deploy get it identically.
 */
async function main(): Promise<void> {
  const env = parseServerEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1, onnotice: () => {} });

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    await sql`CREATE EXTENSION IF NOT EXISTS citext`;
    console.log("[db:migrate] extensions ensured: vector, pg_trgm, citext");

    const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder });
    console.log("[db:migrate] migrations applied (baseline is empty in Sprint 1.1)");
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error("[db:migrate] FAILED:", error);
  process.exit(1);
});
