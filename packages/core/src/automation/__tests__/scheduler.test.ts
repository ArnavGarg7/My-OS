import { describe, expect, it } from "vitest";
import { scheduleRule } from "../scheduler";
import { makeRecord, makeRule } from "../fixtures";
import type { ExecutionRecord } from "../types";

const now = new Date("2026-07-15T12:00:00Z");
function ctx(history: ExecutionRecord[] = []) {
  return { now, timezone: "UTC", history };
}

describe("scheduler policies", () => {
  it("run_always always runs", () => {
    const r = makeRule({ policy: { policy: "run_always" } });
    expect(scheduleRule(r, ctx()).decision).toBe("run");
  });

  it("run_once runs then skips", () => {
    const r = makeRule({ policy: { policy: "run_once" } });
    expect(scheduleRule(r, ctx()).decision).toBe("run");
    const done = makeRecord({
      ruleId: r.id,
      outcome: "completed",
      triggeredAt: "2026-07-15T09:00:00Z",
    });
    expect(scheduleRule(r, ctx([done])).decision).toBe("skip");
  });

  it("cooldown blocks within the window", () => {
    const r = makeRule({ policy: { policy: "cooldown", cooldownMinutes: 60 } });
    const recent = makeRecord({
      ruleId: r.id,
      outcome: "completed",
      triggeredAt: "2026-07-15T11:30:00Z",
    });
    expect(scheduleRule(r, ctx([recent])).decision).toBe("cooldown");
    const old = makeRecord({
      ruleId: r.id,
      outcome: "completed",
      triggeredAt: "2026-07-15T10:00:00Z",
    });
    expect(scheduleRule(r, ctx([old])).decision).toBe("run");
  });

  it("throttle skips within the window", () => {
    const r = makeRule({ policy: { policy: "throttle", throttleMinutes: 5 } });
    const recent = makeRecord({ ruleId: r.id, triggeredAt: "2026-07-15T11:58:00Z" });
    expect(scheduleRule(r, ctx([recent])).decision).toBe("skip");
  });

  it("max_executions caps completed runs", () => {
    const r = makeRule({ policy: { policy: "max_executions", maxExecutions: 2 } });
    const runs = [
      makeRecord({ id: "e1", ruleId: r.id, outcome: "completed" }),
      makeRecord({ id: "e2", ruleId: r.id, outcome: "completed" }),
    ];
    expect(scheduleRule(r, ctx(runs)).decision).toBe("skip");
  });

  it("retry waits for backoff then runs; exhausts after attempts", () => {
    const r = makeRule({ policy: { policy: "retry", retryAttempts: 3, retryBackoffMinutes: 10 } });
    const recentFail = makeRecord({
      ruleId: r.id,
      outcome: "failed",
      triggeredAt: "2026-07-15T11:55:00Z",
    });
    expect(scheduleRule(r, ctx([recentFail])).decision).toBe("retry");
    const oldFail = makeRecord({
      ruleId: r.id,
      outcome: "failed",
      triggeredAt: "2026-07-15T11:00:00Z",
    });
    expect(scheduleRule(r, ctx([oldFail])).decision).toBe("run");
    const manyFails = [1, 2, 3].map((n) =>
      makeRecord({
        id: `f${n}`,
        ruleId: r.id,
        outcome: "failed",
        triggeredAt: "2026-07-15T11:00:00Z",
      }),
    );
    expect(scheduleRule(r, ctx(manyFails)).decision).toBe("skip");
  });

  it("delay returns a future runAt", () => {
    const r = makeRule({ policy: { policy: "delay", delayMinutes: 15 } });
    const d = scheduleRule(r, ctx());
    expect(d.decision).toBe("delay");
    expect(d.runAt).toBe("2026-07-15T12:15:00.000Z");
  });

  it("schedule delays before the time and runs after", () => {
    const early = new Date("2026-07-15T08:00:00Z");
    const r = makeRule({ policy: { policy: "schedule", scheduleAt: "12:00" } });
    expect(scheduleRule(r, { now: early, timezone: "UTC", history: [] }).decision).toBe("delay");
    expect(scheduleRule(r, ctx()).decision).toBe("run");
  });

  it("manual_approval always skips", () => {
    const r = makeRule({ policy: { policy: "manual_approval" } });
    expect(scheduleRule(r, ctx()).decision).toBe("skip");
  });
});
