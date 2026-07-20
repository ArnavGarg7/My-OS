// @ts-check
/**
 * Documentation validator (Sprint 5.5, Documentation Overhaul).
 *
 * Verifies the Release-Candidate documentation set exists: the 10 ADRs, the developer guides, the
 * standards, the deployment + contributing docs, the release bundle, and the architecture diagrams.
 * A missing doc fails CI so the docs never silently rot behind the code.
 *
 * Pure filesystem. Run: node scripts/docs-validator.mjs
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");

const REQUIRED = [
  // ADRs
  ...Array.from({ length: 10 }, (_, i) => `adr/ADR-${String(i + 1).padStart(3, "0")}.md`),
  // Guides
  "guides/development.md",
  "guides/architecture.md",
  "guides/debugging.md",
  "guides/testing.md",
  "guides/deployment.md",
  // Standards
  "standards/coding.md",
  "standards/naming.md",
  "standards/packages.md",
  // Contributing
  "contributing/CONTRIBUTING.md",
  // Deployment
  "deployment/checklist.md",
  "deployment/rollback.md",
  // Release
  "release/release-notes.md",
  "release/known-limitations.md",
  "release/future-work.md",
  "release/breaking-changes.md",
  // Reports
  "reports/migration-report.md",
  // Diagrams
  "diagrams/system-architecture.md",
  "diagrams/ai-pipeline.md",
  "diagrams/chief-pipeline.md",
  "diagrams/planner-pipeline.md",
  "diagrams/dependency-graph.md",
];

// Every package must have a README too.
const PKG_READMES = ["ai", "core", "db", "shared", "ui"]
  .map((p) => join("packages", p, "README.md"))
  .concat(["web", "worker"].map((p) => join("apps", p, "README.md")));

const missing = [];
for (const rel of REQUIRED) if (!existsSync(join(docs, rel))) missing.push(`docs/${rel}`);
for (const rel of PKG_READMES) if (!existsSync(join(root, rel))) missing.push(rel);

console.log("Documentation completeness");
console.log("==========================");
console.log(`Required docs: ${REQUIRED.length} · Package READMEs: ${PKG_READMES.length}`);
if (missing.length) {
  console.log(`\nFAIL: ${missing.length} missing:`);
  for (const m of missing) console.log("  ✗ " + m);
  process.exit(1);
}
console.log("\nPASS: the Release-Candidate documentation set is complete.");
