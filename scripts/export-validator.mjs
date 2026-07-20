// @ts-check
/**
 * Export / public-API boundary validator (Sprint 5.5, Architecture Freeze).
 *
 * Enforces the layered-package contract:
 *   - every publishable `@myos/*` package exposes a single `src/index.ts` barrel and an
 *     `exports` map in package.json (no consumer reaches into internals);
 *   - no code imports another WORKSPACE package via a deep path (`@myos/core/src/...` or an
 *     undeclared subpath) — only the package root or a declared `./subpath` export is allowed.
 *
 * Pure filesystem+regex (no compilation), so it runs identically locally and in CI.
 * Run: node scripts/export-validator.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Publishable packages (apps are private and have no barrel/exports contract). */
const PACKAGES = ["ai", "core", "db", "shared", "ui"];

/** Collect every .ts/.tsx file under a dir (skips node_modules/dist/.next). */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".next") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const errors = [];
const info = [];

// 1. Every package has a barrel + exports map, and every declared subpath resolves to a file.
const declaredSubpaths = {}; // pkg -> Set of "." and "./sub"
for (const pkg of PACKAGES) {
  const pkgDir = join(root, "packages", pkg);
  const manifestPath = join(pkgDir, "package.json");
  if (!existsSync(manifestPath)) {
    errors.push(`packages/${pkg}: missing package.json`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!existsSync(join(pkgDir, "src", "index.ts"))) {
    errors.push(`packages/${pkg}: missing src/index.ts barrel`);
  }
  const exp = manifest.exports;
  if (!exp || typeof exp !== "object") {
    errors.push(`packages/${pkg}: package.json has no "exports" map`);
    declaredSubpaths[pkg] = new Set(["."]);
    continue;
  }
  const subs = new Set(Object.keys(exp));
  declaredSubpaths[pkg] = subs;
  if (!subs.has(".")) errors.push(`packages/${pkg}: exports map has no root "." entry`);
  for (const [key, target] of Object.entries(exp)) {
    const rel = typeof target === "string" ? target : "";
    if (rel && !existsSync(join(pkgDir, rel.replace(/^\.\//, "")))) {
      errors.push(`packages/${pkg}: exports "${key}" → ${rel} does not exist`);
    }
  }
  info.push(`packages/${pkg}: ${subs.size} public export(s)`);
}

// 2. No deep imports into another workspace package.
const importRe =
  /(?:import|export)[^"']*?from\s*["'](@myos\/[^"']+)["']|import\(["'](@myos\/[^"']+)["']\)/g;
const scanDirs = [
  ...PACKAGES.map((p) => join(root, "packages", p, "src")),
  join(root, "apps", "web"),
  join(root, "apps", "worker", "src"),
];
let deepImportCount = 0;
for (const dir of scanDirs) {
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    let m;
    while ((m = importRe.exec(text))) {
      const spec = m[1] ?? m[2];
      if (!spec) continue;
      const parts = spec.split("/"); // ["@myos", "core", "sub?"...]
      const pkg = parts[1];
      if (!PACKAGES.includes(pkg)) continue; // app-internal aliases handled elsewhere
      const subpath = parts.length > 2 ? `./${parts.slice(2).join("/")}` : ".";
      // `src/...` is always a forbidden deep import.
      if (subpath.startsWith("./src")) {
        errors.push(
          `${relative(root, file)}: deep import "${spec}" (reaches into package internals)`,
        );
        deepImportCount++;
        continue;
      }
      const declared = declaredSubpaths[pkg];
      if (declared && !declared.has(subpath)) {
        errors.push(
          `${relative(root, file)}: undeclared subpath import "${spec}" (not in @myos/${pkg} exports)`,
        );
        deepImportCount++;
      }
    }
  }
}

console.log("Export / public-API boundary audit");
console.log("===================================");
for (const line of info) console.log("  " + line);
console.log(`\nDeep/undeclared workspace imports: ${deepImportCount}`);
if (errors.length) {
  console.log(`\nFAIL: ${errors.length} violation(s):`);
  for (const e of errors) console.log("  ✗ " + e);
  process.exit(1);
}
console.log("\nPASS: every package exposes a single barrel; no deep imports.");
