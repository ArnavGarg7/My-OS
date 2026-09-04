import { describe, expect, it } from "vitest";
import { resolveRecommendationTarget, resolveSignalTarget } from "./actions";

describe("resolveRecommendationTarget", () => {
  it("executes a task-anchored focus recommendation directly", () => {
    const t = resolveRecommendationTarget("start_focus", {
      module: "task",
      id: "t1",
      label: "Draft report",
    });
    expect(t).toEqual({ kind: "focus", taskId: "t1", label: "Focus on Draft report" });
  });

  it("routes start_focus without a task to the Focus surface", () => {
    const t = resolveRecommendationTarget("start_focus", null);
    expect(t).toEqual({ kind: "navigate", href: "/focus", label: "Start a focus session" });
  });

  it("routes review to the decisions surface", () => {
    const t = resolveRecommendationTarget("review", null);
    expect(t?.kind).toBe("navigate");
    expect((t as { href: string }).href).toBe("/today#morning-recommendation");
  });

  it("routes plan to tomorrow", () => {
    expect((resolveRecommendationTarget("plan", null) as { href: string }).href).toBe("/tomorrow");
  });

  it("executes a bare task reference even without a known action", () => {
    const t = resolveRecommendationTarget("unknown_action", { module: "task", id: "t9" });
    expect(t).toEqual({ kind: "focus", taskId: "t9", label: "Start focus session" });
  });

  it("returns null when nothing is executable", () => {
    expect(resolveRecommendationTarget("mystery", null)).toBeNull();
  });
});

describe("resolveSignalTarget", () => {
  it("focuses on a task a signal is about", () => {
    const t = resolveSignalTarget([{ module: "task", id: "t2", label: "Ship v2" }]);
    expect(t).toEqual({ kind: "focus", taskId: "t2", label: "Focus on Ship v2" });
  });

  it("routes a decision signal to review", () => {
    const t = resolveSignalTarget([{ module: "decision", id: "d1" }]);
    expect(t).toEqual({
      kind: "navigate",
      href: "/today#morning-recommendation",
      label: "Review decisions",
    });
  });

  it("routes a project signal to projects", () => {
    const t = resolveSignalTarget([{ module: "project", id: "p1", label: "Capstone" }]);
    expect(t).toEqual({ kind: "navigate", href: "/projects", label: "Open Capstone" });
  });

  it("returns null for a signal that grounds to nothing actionable", () => {
    expect(resolveSignalTarget([])).toBeNull();
    expect(resolveSignalTarget([{ module: "environment", id: "x" }])).toBeNull();
  });
});
