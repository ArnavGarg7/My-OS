import { describe, expect, it, vi } from "vitest";
import { AnalyticsEmitter } from "./emitter";
import { describeMetric, METRIC_REGISTRY } from "./registry";
import { METRIC_KINDS } from "./types";

describe("AnalyticsEmitter", () => {
  it("tracks a counter with default value 1", () => {
    const a = new AnalyticsEmitter();
    const ev = a.track({ kind: "task.completed" });
    expect(ev.id).toBe("m_1");
    expect(ev.value).toBe(1);
    expect(a.count("task.completed")).toBe(1);
  });

  it("accumulates counts across events", () => {
    const a = new AnalyticsEmitter();
    a.track({ kind: "decision.accepted" });
    a.track({ kind: "decision.accepted" });
    expect(a.count("decision.accepted")).toBe(2);
  });

  it("averages gauge values (planner accuracy)", () => {
    const a = new AnalyticsEmitter();
    a.track({ kind: "planner.accuracy", value: 80 });
    a.track({ kind: "planner.accuracy", value: 100 });
    expect(a.average("planner.accuracy")).toBe(90);
  });

  it("returns 0 average for an untracked metric", () => {
    expect(new AnalyticsEmitter().average("workout.logged")).toBe(0);
  });

  it("notifies subscribers and unsubscribes", () => {
    const a = new AnalyticsEmitter();
    const fn = vi.fn();
    const off = a.subscribe(fn);
    a.track({ kind: "task.created" });
    expect(fn).toHaveBeenCalledOnce();
    off();
    a.track({ kind: "task.created" });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("bounds recent events and returns them most-recent-first", () => {
    const a = new AnalyticsEmitter(2);
    a.track({ kind: "task.created", meta: { n: 1 } });
    a.track({ kind: "task.created", meta: { n: 2 } });
    a.track({ kind: "task.created", meta: { n: 3 } });
    expect(a.recent().map((e) => e.meta?.n)).toEqual([3, 2]);
  });

  it("clears counts and buffer", () => {
    const a = new AnalyticsEmitter();
    a.track({ kind: "task.completed" });
    a.clear();
    expect(a.count("task.completed")).toBe(0);
    expect(a.recent()).toEqual([]);
  });
});

describe("analytics registry", () => {
  it("describes every metric kind", () => {
    for (const kind of METRIC_KINDS) {
      expect(describeMetric(kind).label.length).toBeGreaterThan(0);
      expect(describeMetric(kind)).toBe(METRIC_REGISTRY[kind]);
    }
  });
});
