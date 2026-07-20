import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/**
 * Architecture / Release-Candidate guardrails (Sprint 5.5, Architecture Freeze). Runs the pure
 * repository validators and asserts each exits 0 — so a layering violation, a deep import, a broken
 * migration chain, a below-standard package, or a missing doc fails CI as a test, not just a script.
 */

const repoRoot = join(__dirname, "..", "..", "..");
function run(script: string): { ok: boolean; code: number } {
  try {
    execFileSync(process.execPath, [join(repoRoot, "scripts", script)], { stdio: "pipe" });
    return { ok: true, code: 0 };
  } catch (err) {
    const code =
      typeof (err as { status?: number }).status === "number"
        ? (err as { status: number }).status
        : 1;
    return { ok: false, code };
  }
}

describe("architecture freeze — repository validators", () => {
  it("public-API export boundaries hold (single barrel, no deep imports)", () => {
    expect(run("export-validator.mjs").ok).toBe(true);
  });
  it("migration history is contiguous and paired with snapshots", () => {
    expect(run("migration-validator.mjs").ok).toBe(true);
  });
  it("every package meets the standard artifact set", () => {
    expect(run("package-health.mjs").ok).toBe(true);
  });
  it("the Release-Candidate documentation set is complete", () => {
    expect(run("docs-validator.mjs").ok).toBe(true);
  });
  it("the aggregate repository audit passes (architecture frozen)", () => {
    expect(run("repository-audit.mjs").ok).toBe(true);
  });
});
