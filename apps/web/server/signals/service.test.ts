import { describe, expect, it, vi } from "vitest";
import type { Database } from "@myos/db";

/**
 * Signals service tests (Sprint 6.1). The watchers and repository are mocked so the service is
 * exercised without a DB — proving it runs a deterministic Event-Intelligence cycle (generate →
 * detect → rank → aggregate → suppress → notify), returns ranked signals, and NEVER mutates user
 * data (only inserts immutable signals + status transitions via the repository).
 */

vi.mock("./watchers", () => ({
  gatherWatcherInputs: vi.fn(async () => ({
    events: [],
    risk: {
      deadlines: [
        { id: "d1", label: "Essay", daysRemaining: 1, estimateHours: 8, availableHours: 3 },
      ],
      readiness: 20,
      meetingsToday: 6,
      daysSinceWorkout: 0,
      exams: [],
    },
    opportunity: {
      freedMinutes: 90,
      earlyCompletion: null,
      readiness: 20,
      freeEvening: false,
      resumableProject: null,
    },
  })),
}));

const recorded: unknown[] = [];
vi.mock("./repository", () => ({
  loadActiveSignals: vi.fn(async () => []),
  recordCycle: vi.fn(async (_db, cycle) => recorded.push(cycle)),
  listTimeline: vi.fn(async () => [
    { signalId: "s1", kind: "signal_created", detail: "x", at: new Date() },
  ]),
  listHistory: vi.fn(async () => []),
  loadSubscription: vi.fn(async () => null),
  saveSubscription: vi.fn(async () => {}),
  acknowledgeSignal: vi.fn(async () => {}),
}));

// Sprint 6.2: the cycle folds in Prediction Signals; mock the seam so this unit stays isolated.
vi.mock("../prediction/service", () => ({ predictionSignals: vi.fn(async () => []) }));

import * as service from "./service";
const db = {} as Database;

describe("signals.current / risks / opportunities", () => {
  it("runs a cycle and returns ranked active signals with counts", async () => {
    const r = await service.current(db, "Asia/Kolkata");
    expect(r.signals.length).toBeGreaterThan(0);
    expect(r.counts.total).toBe(r.signals.length);
    // ranked by priority desc
    const p = r.signals.map((s) => s.ranking.priority);
    expect([...p].sort((a, b) => b - a)).toEqual(p);
    // persisted an immutable cycle
    expect(recorded.length).toBeGreaterThan(0);
  });
  it("detects a burnout risk and a free-window opportunity", async () => {
    expect(
      (await service.risks(db, "Asia/Kolkata")).signals.some(
        (s) => s.explanation.headline === "Burnout risk",
      ),
    ).toBe(true);
    expect(
      (await service.opportunities(db, "Asia/Kolkata")).signals.some(
        (s) => s.category === "opportunities",
      ),
    ).toBe(true);
  });
});

describe("signals.forChief / signalDisruptions — the Chief seam", () => {
  it("feeds the Chief top signals + maps them to disruptions", async () => {
    const top = await service.forChief(db, "Asia/Kolkata");
    expect(top.length).toBeGreaterThan(0);
    const dis = await service.signalDisruptions(db, "Asia/Kolkata");
    expect(dis.some((d) => d.kind === "low_energy" || d.kind === "free_time")).toBe(true);
  });
});

describe("signals.timeline / subscribe", () => {
  it("returns the replay timeline", async () => {
    expect((await service.timeline(db)).length).toBeGreaterThan(0);
  });
  it("reads default subscription preferences", async () => {
    expect((await service.subscribe(db)).minLevel).toBe("suggestion");
  });
});
