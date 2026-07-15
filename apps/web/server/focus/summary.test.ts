import { beforeEach, describe, expect, it, vi } from "vitest";
import { completedSession, makeSession } from "@myos/core/focus";

const h = vi.hoisted(() => ({
  getActive: vi.fn(),
  listByDate: vi.fn(),
  upsertSummary: vi.fn(),
  buildHealthSignals: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("../health/summary", () => ({ buildSignals: h.buildHealthSignals }));

import * as summary from "./summary";

const TZ = "UTC";

beforeEach(() => {
  vi.clearAllMocks();
  h.getActive.mockResolvedValue(null);
  h.listByDate.mockResolvedValue([]);
  h.upsertSummary.mockResolvedValue({});
  h.buildHealthSignals.mockResolvedValue({
    readiness: 82,
    recovery: "high",
    sleepMinutes: 440,
    energy: "high",
    hydrationPercent: 65,
    lowSleep: false,
    highReadiness: true,
    nextWorkoutType: null,
  });
});

describe("focus summary service", () => {
  it("summarises today's sessions", async () => {
    h.listByDate.mockResolvedValue([
      completedSession("a", "deep_work", 50),
      completedSession("b", "shallow_work", 25),
    ]);
    const s = await summary.summary(db, TZ);
    expect(s.focusMinutesToday).toBe(75);
    expect(s.completedToday).toBe(2);
  });

  it("reports remaining minutes for an active session", async () => {
    h.getActive.mockResolvedValue(
      makeSession({ status: "running", startedAt: "2020-01-01T00:00:00Z", plannedMinutes: 50 }),
    );
    const s = await summary.summary(db, TZ);
    expect(s.active).toBe(true);
  });

  it("computes derived metrics", async () => {
    h.listByDate.mockResolvedValue([
      completedSession("a", "deep_work", 50, { plannerBlockId: "b" }),
    ]);
    const m = await summary.metrics(db, TZ);
    expect(m.deepWorkMinutes).toBe(50);
    expect(m.plannerAccuracy).toBe(100);
  });

  it("maps health readiness onto a focus band", async () => {
    const r = await summary.readiness(db, TZ);
    expect(r.score).toBe(82);
    expect(r.level).toBe("good");
  });

  it("falls back to neutral readiness when health throws", async () => {
    h.buildHealthSignals.mockRejectedValue(new Error("no data"));
    const r = await summary.readiness(db, TZ);
    expect(r.score).toBe(0);
    expect(r.level).toBe("average");
  });

  it("persists a derived daily summary snapshot", async () => {
    h.listByDate.mockResolvedValue([completedSession("a", "deep_work", 50)]);
    await summary.persistDailySummary(db, TZ);
    expect(h.upsertSummary).toHaveBeenCalledOnce();
    const arg = h.upsertSummary.mock.calls[0]?.[1];
    expect(arg.deepWorkMinutes).toBe(50);
  });
});

const db = {} as never;
