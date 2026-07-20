// @ts-check
/**
 * Migration validator (Sprint 5.5, Database Audit).
 *
 * Validates the Drizzle migration history against production standards:
 *   - the journal (`meta/_journal.json`) indices are contiguous from 0 with no gaps/dups;
 *   - every journal entry has a matching `NNNN_tag.sql` file AND a `meta/NNNN_snapshot.json`;
 *   - no orphan .sql files or snapshots exist that the journal doesn't reference;
 *   - file tags follow the `NNNN_snake_case` naming convention.
 *
 * Pure filesystem (no DB connection), so it runs in CI. Reports a per-migration table.
 * Run: node scripts/migration-validator.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migDir = join(root, "packages", "db", "migrations");
const metaDir = join(migDir, "meta");

const errors = [];

const journal = JSON.parse(readFileSync(join(metaDir, "_journal.json"), "utf8"));
const entries = journal.entries ?? [];

const sqlFiles = new Set(readdirSync(migDir).filter((f) => f.endsWith(".sql")));
const snapshots = new Set(readdirSync(metaDir).filter((f) => /^\d+_snapshot\.json$/.test(f)));

const referencedSql = new Set();
const referencedSnap = new Set();

entries.forEach((e, i) => {
  // Contiguous index.
  if (e.idx !== i) errors.push(`journal entry ${i}: idx=${e.idx} (expected ${i}) — gap or reorder`);
  const tag = e.tag ?? "";
  if (!/^\d{4}_[a-z0-9_]+$/.test(tag))
    errors.push(`entry ${i}: tag "${tag}" is not NNNN_snake_case`);
  const sql = `${tag}.sql`;
  const num = tag.slice(0, 4);
  const snap = `${num}_snapshot.json`;
  if (!sqlFiles.has(sql)) errors.push(`entry ${i} (${tag}): missing SQL file ${sql}`);
  else referencedSql.add(sql);
  if (!snapshots.has(snap)) errors.push(`entry ${i} (${tag}): missing snapshot ${snap}`);
  else referencedSnap.add(snap);
});

// Orphans.
for (const f of sqlFiles)
  if (!referencedSql.has(f)) errors.push(`orphan SQL file not in journal: ${f}`);
for (const f of snapshots)
  if (!referencedSnap.has(f)) errors.push(`orphan snapshot not in journal: ${f}`);

console.log("Migration history audit");
console.log("=======================");
console.log(`Journal entries: ${entries.length}`);
console.log(`SQL files: ${sqlFiles.size} · Snapshots: ${snapshots.size}`);
console.log(`Latest: ${entries[entries.length - 1]?.tag ?? "(none)"}`);
if (errors.length) {
  console.log(`\nFAIL: ${errors.length} issue(s):`);
  for (const e of errors) console.log("  ✗ " + e);
  process.exit(1);
}
console.log(
  "\nPASS: migrations are contiguous, named consistently, and fully paired with snapshots.",
);
