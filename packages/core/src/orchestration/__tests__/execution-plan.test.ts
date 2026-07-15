import { describe, expect, it } from "vitest";
import { buildPlan, planEdges } from "../execution-plan";
import { makeContext } from "../fixtures";

describe("execution plan", () => {
  it("builds an ordered plan for the calendar pipeline", () => {
    const plan = buildPlan("calendar", "calendar.meeting_added", makeContext());
    expect(plan.order.map((s) => s.module)).toEqual([
      "calendar",
      "planner",
      "decision",
      "morning",
      "tomorrow",
      "notification",
      "timeline",
      "analytics",
    ]);
    expect(plan.skipped).toEqual([]);
    expect(plan.affected).toHaveLength(8);
  });

  it("assigns sequential order indices", () => {
    const plan = buildPlan("finance", "finance.budget_exceeded", makeContext());
    plan.order.forEach((step, i) => expect(step.order).toBe(i));
  });

  it("skips unavailable modules", () => {
    const plan = buildPlan(
      "calendar",
      "calendar.meeting_added",
      makeContext({ unavailable: ["timeline"] }),
    );
    expect(plan.skipped).toContain("timeline");
    expect(plan.affected).not.toContain("timeline");
  });

  it("records per-step mode", () => {
    const plan = buildPlan("calendar", "calendar.meeting_added", makeContext());
    const planner = plan.order.find((s) => s.module === "planner");
    expect(planner?.mode).toBe("regenerate");
  });

  it("computes dependency links within the plan", () => {
    const plan = buildPlan("finance", "finance.budget_exceeded", makeContext());
    const decision = plan.order.find((s) => s.module === "decision");
    expect(decision?.dependsOn).toContain("finance");
  });

  it("summary describes the run", () => {
    const plan = buildPlan("calendar", "calendar.meeting_added", makeContext());
    expect(plan.summary).toContain("calendar pipeline");
    expect(plan.summary).toContain("8 modules");
  });

  it("summary notes skipped modules", () => {
    const plan = buildPlan(
      "calendar",
      "calendar.meeting_added",
      makeContext({ unavailable: ["notification"] }),
    );
    expect(plan.summary).toContain("skipped");
  });

  it("planEdges produces dependency edges", () => {
    const plan = buildPlan("finance", "finance.budget_exceeded", makeContext());
    const edges = planEdges(plan);
    expect(edges.some((e) => e.from === "finance" && e.to === "decision")).toBe(true);
  });
});
