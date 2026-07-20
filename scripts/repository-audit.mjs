// @ts-check
/**
 * Repository auditor (Sprint 5.5, Release Candidate).
 *
 * The single entry point that runs every architecture/standards validator and reports one
 * verdict — the gate CI uses to certify a Release Candidate. Each check is an existing pure
 * `.mjs` script; this runner sequences them and aggregates pass/fail.
 *
 * Run: node scripts/repository-audit.mjs
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CHECKS = [
  ["API contracts", "api-audit.mjs"],
  ["Dependency direction", "dependency-graph.mjs"],
  ["Schema classification", "schema-audit.mjs"],
  ["Security classification", "security-audit.mjs"],
  ["Public-API exports", "export-validator.mjs"],
  ["Migration history", "migration-validator.mjs"],
  ["Package health", "package-health.mjs"],
  ["Documentation set", "docs-validator.mjs"],
];

console.log("╔══════════════════════════════════════════╗");
console.log("║   My OS — Release Candidate audit         ║");
console.log("╚══════════════════════════════════════════╝\n");

const results = [];
for (const [label, script] of CHECKS) {
  try {
    execFileSync(process.execPath, [join(root, "scripts", script)], { stdio: "ignore" });
    results.push({ label, ok: true });
    console.log(`  ✓ ${label}`);
  } catch {
    results.push({ label, ok: false });
    console.log(`  ✗ ${label}  (run: node scripts/${script})`);
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) {
  console.log("REPOSITORY AUDIT: FAIL");
  process.exit(1);
}
console.log("REPOSITORY AUDIT: PASS — architecture is frozen and consistent.");
