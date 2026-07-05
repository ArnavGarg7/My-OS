import postgres from "postgres";
import { loadRootEnv, parseServerEnv } from "@myos/shared/env";

loadRootEnv();

/**
 * Verify database connectivity + required extensions. Used by `pnpm db:check`
 * and mirrored by the /api/health endpoint and worker boot check.
 */
async function main(): Promise<void> {
  const env = parseServerEnv();
  const sql = postgres(env.DATABASE_URL, { max: 1 });

  try {
    const [info] = await sql<{ version: string; db: string }[]>`
      SELECT version() AS version, current_database() AS db
    `;
    const extensions = await sql<{ extname: string }[]>`
      SELECT extname FROM pg_extension ORDER BY extname
    `;
    const names = extensions.map((e) => e.extname);
    const hasVector = names.includes("vector");

    console.log(`[db:check] connected to "${info?.db}"`);
    console.log(`[db:check] ${info?.version}`);
    console.log(`[db:check] extensions: ${names.join(", ") || "(none)"}`);
    console.log(
      hasVector
        ? "[db:check] pgvector present ✓"
        : "[db:check] pgvector MISSING ✗ (run `pnpm db:migrate`)",
    );

    process.exitCode = hasVector ? 0 : 1;
  } catch (error: unknown) {
    console.error("[db:check] FAILED:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void main();
