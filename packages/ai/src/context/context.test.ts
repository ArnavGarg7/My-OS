import { describe, expect, it } from "vitest";
import { BUILDER_SPECS, FEATURE_PROFILES, buildProfile, runBuilder } from "./builders";
import { allocateBudget } from "./budget-manager";
import { serializeSnapshotData } from "./serializer";
import type { Snapshot } from "./snapshot";

describe("context builders", () => {
  it("runs a builder into a snapshot with a token estimate", () => {
    const snap = runBuilder("today", { date: "2026-07-18", energy: "high" });
    expect(snap.builder).toBe("today");
    expect(snap.tokenEstimate).toBeGreaterThan(0);
    expect(snap.priority).toBe(BUILDER_SPECS.today!.priority);
  });

  it("season is in every feature profile (FR-SEASON-4)", () => {
    for (const names of Object.values(FEATURE_PROFILES)) expect(names).toContain("season");
  });

  it("builds only the snapshots present in the data map for a feature", () => {
    const snaps = buildProfile("assistant", { profile: { tz: "UTC" }, today: { x: 1 } });
    expect(snaps.map((s) => s.builder).sort()).toEqual(["profile", "today"]);
  });

  it("serializes deterministically", () => {
    expect(serializeSnapshotData({ b: 1, a: 2 }).serialized).toBe(
      serializeSnapshotData({ a: 2, b: 1 }).serialized,
    );
  });
});

describe("budget manager", () => {
  const mk = (builder: string, tokens: number, priority: number): Snapshot => ({
    builder,
    data: {},
    tokenEstimate: tokens,
    priority,
  });

  it("keeps highest-priority snapshots within budget, drops the rest", () => {
    const result = allocateBudget([mk("a", 100, 10), mk("b", 100, 90), mk("c", 100, 50)], 200);
    expect(result.included.map((s) => s.builder)).toEqual(["b", "c"]);
    expect(result.dropped).toEqual(["a"]);
    expect(result.totalTokens).toBe(200);
  });

  it("includes everything when it fits", () => {
    const result = allocateBudget([mk("a", 10, 1), mk("b", 10, 2)], 8000);
    expect(result.dropped).toHaveLength(0);
  });

  it("breaks priority ties by builder name deterministically", () => {
    const result = allocateBudget([mk("z", 50, 5), mk("a", 50, 5)], 50);
    expect(result.included.map((s) => s.builder)).toEqual(["a"]);
  });
});
