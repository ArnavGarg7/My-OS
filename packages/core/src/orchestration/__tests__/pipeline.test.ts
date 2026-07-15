import { describe, expect, it } from "vitest";
import {
  PIPELINES,
  PIPELINE_TRIGGERS,
  pipelineForEvent,
  pipelineModules,
  pipelineSteps,
} from "../pipeline";
import { PIPELINE_KINDS } from "../constants";
import { hasCycle, subgraph } from "../dependency-graph";
import { MODULE_DEPENDENCIES } from "../constants";

describe("pipelines", () => {
  it("defines all 10 pipelines", () => {
    expect(PIPELINE_KINDS).toHaveLength(10);
    for (const k of PIPELINE_KINDS) expect(PIPELINES[k].length).toBeGreaterThan(0);
  });

  it("every pipeline ends at analytics via timeline", () => {
    for (const k of PIPELINE_KINDS) {
      const mods = PIPELINES[k].map((s) => s.module);
      expect(mods[mods.length - 1]).toBe("analytics");
      expect(mods).toContain("timeline");
    }
  });

  it("calendar pipeline matches the spec flow", () => {
    const mods = PIPELINES.calendar.map((s) => s.module);
    expect(mods).toEqual([
      "calendar",
      "planner",
      "decision",
      "morning",
      "tomorrow",
      "notification",
      "timeline",
      "analytics",
    ]);
  });

  it("health pipeline touches planner in recommend mode only (never regenerate)", () => {
    const plannerStep = PIPELINES.health.find((s) => s.module === "planner");
    expect(plannerStep?.mode).toBe("recommend");
    expect(PIPELINES.health.some((s) => s.module === "planner" && s.mode === "regenerate")).toBe(
      false,
    );
  });

  it("focus pipeline refreshes planner execution (not regenerate)", () => {
    const plannerStep = PIPELINES.focus.find((s) => s.module === "planner");
    expect(plannerStep?.mode).toBe("refresh");
  });

  it("resolves an event to its pipeline by explicit trigger", () => {
    expect(pipelineForEvent("calendar.meeting_added")).toBe("calendar");
    expect(pipelineForEvent("focus.completed")).toBe("focus");
    expect(pipelineForEvent("finance.budget_exceeded")).toBe("finance");
  });

  it("resolves by module prefix as a fallback", () => {
    expect(pipelineForEvent("planner.something_new")).toBe("planner");
  });

  it("returns null for an unknown event", () => {
    expect(pipelineForEvent("nonsense.event")).toBeNull();
  });

  it("pipelineModules returns distinct modules", () => {
    const mods = pipelineModules("calendar");
    expect(new Set(mods).size).toBe(mods.length);
  });

  it("no pipeline subgraph has a cycle", () => {
    for (const k of PIPELINE_KINDS) {
      const nodes = pipelineModules(k);
      expect(hasCycle(nodes, subgraph(nodes, MODULE_DEPENDENCIES))).toBe(false);
    }
  });

  it("every pipeline has trigger events", () => {
    for (const k of PIPELINE_KINDS) expect(PIPELINE_TRIGGERS[k].length).toBeGreaterThan(0);
  });

  it("pipelineSteps returns the ordered spec", () => {
    expect(pipelineSteps("morning")[0]?.module).toBe("morning");
  });
});
