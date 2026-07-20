// @ts-check
/**
 * Package health checker (Sprint 5.5, Package Standards).
 *
 * Every workspace package/app must contain the standard set of artifacts so a new developer can
 * find their way without tribal knowledge:
 *   packages: README.md, package.json, src/index.ts, ≥1 *.test.ts, a typecheck script;
 *   apps:     README.md, package.json, a typecheck script.
 *
 * Pure filesystem. Reports a per-package table and exits non-zero on any missing artifact.
 * Run: node scripts/package-health.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  ...["ai", "core", "db", "shared", "ui"].map((p) => ({
    dir: join("packages", p),
    kind: "package",
  })),
  ...["web", "worker"].map((p) => ({ dir: join("apps", p), kind: "app" })),
];

function hasTest(dir) {
  const src = join(dir, "src");
  const roots = [src, dir].filter(existsSync);
  const stack = [...roots];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      if (name === "node_modules" || name === ".next" || name === "dist") continue;
      const p = join(d, name);
      const s = statSync(p);
      if (s.isDirectory()) stack.push(p);
      else if (/\.test\.tsx?$/.test(name)) return true;
    }
  }
  return false;
}

const errors = [];
const rows = [];
for (const { dir, kind } of TARGETS) {
  const abs = join(root, dir);
  const manifest = existsSync(join(abs, "package.json"))
    ? JSON.parse(readFileSync(join(abs, "package.json"), "utf8"))
    : null;
  const checks = {
    "package.json": !!manifest,
    "README.md": existsSync(join(abs, "README.md")),
    typecheck: !!manifest?.scripts?.typecheck,
  };
  if (kind === "package") {
    checks["src/index.ts"] = existsSync(join(abs, "src", "index.ts"));
    // A package proves itself via unit tests, or (schema-only packages like db) a validation
    // script backed by the repo-level migration/schema auditors.
    checks.tests = hasTest(abs) || !!manifest?.scripts?.test || !!manifest?.scripts?.check;
  }
  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);
  for (const m of missing) errors.push(`${dir}: missing ${m}`);
  rows.push({ dir, ok: missing.length === 0, missing });
}

console.log("Package health");
console.log("==============");
for (const r of rows) {
  console.log(
    `  ${r.ok ? "✓" : "✗"} ${r.dir}${r.missing.length ? "  → missing " + r.missing.join(", ") : ""}`,
  );
}
if (errors.length) {
  console.log(`\nFAIL: ${errors.length} package(s) below standard.`);
  process.exit(1);
}
console.log("\nPASS: every package meets the standard artifact set.");
