import { loadRootEnv, parseServerEnv } from "@myos/shared/env";
import { createDb } from "./index";
import { isSealed, sealField } from "./crypto";

/**
 * One-time backfill for Tier-1 field encryption (Stage C). Encrypts any rows whose `private` body
 * columns are still plaintext (rows written before `encryptedText` was applied). Uses the RAW sql
 * client so it bypasses the Drizzle transform — reading the stored value as-is and writing the sealed
 * value directly (no double-encryption). Idempotent: already-sealed values are skipped.
 *
 * Run once after deploying the encryption change:  pnpm --filter @myos/db backfill:encryption
 * ⚠️ Back up the database first; and back up MYOS_DATA_ENCRYPTION_KEY separately (lose it → data lost).
 */
const TARGETS: readonly [table: string, column: string][] = [
  ["journal_entries", "content"],
  ["journal_reviews", "summary"],
  ["knowledge_notes", "content"],
  ["wiki_pages", "content"],
  ["inbox_items", "content"],
  ["messages", "body"],
];

async function main(): Promise<void> {
  loadRootEnv();
  const env = parseServerEnv();
  const { sql, close } = createDb(env.DATABASE_URL, { max: 2 });
  let total = 0;
  for (const [table, column] of TARGETS) {
    const rows = (await sql`SELECT id, ${sql(column)} AS val FROM ${sql(table)}`) as {
      id: string;
      val: string | null;
    }[];
    let n = 0;
    for (const row of rows) {
      if (!row.val || isSealed(row.val)) continue;
      await sql`UPDATE ${sql(table)} SET ${sql(column)} = ${sealField(row.val)} WHERE id = ${row.id}`;
      n++;
    }
    console.log(`  ${table}.${column}: encrypted ${n} of ${rows.length}`);
    total += n;
  }
  console.log(`backfill complete: ${total} rows encrypted`);
  await close();
}

main().catch((error: unknown) => {
  console.error("backfill failed:", error);
  process.exit(1);
});
