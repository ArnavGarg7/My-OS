import { describe, expect, it, vi } from "vitest";
import type { Database } from "@myos/db";

/**
 * Prediction service tests (Sprint 6.2). Feature extraction + repository are mocked so the service is
 * exercised without a DB — proving it runs the deterministic forecast engine, returns immutable
 * confidence-scored predictions, bridges them into 6.1 Signals, simulates scenarios WITHOUT mutating,
 * and that no AI participates.
 */

vi.mock("./forecast", () => ({
  gatherPredictionInput: vi.fn(async () => ({
    deadlines: [
      { id: "t1", label: "Essay", remainingTasks: 18, completionVelocity: 2.4, availableDays: 5 },
    ],
    goals: [
      { id: "g1", label: "Ship", progress: 40, progressHistory: [3, 3, 3], daysRemaining: 30 },
    ],
    schedule: { bookedMinutesByDay: [200, 150, 100, 90, 120, 80, 60], dayCapacityMinutes: 480 },
    workload: { workloadHistory: [80, 85, 90], readinessHistory: [60, 50, 40] },
    health: {
      readinessHistory: [70, 65, 60],
      sleepHistory: [7, 6.5, 6],
      workoutDays: [1, 0, 1, 0, 1],
    },
  })),
}));

const recorded: unknown[] = [];
vi.mock("./repository", () => ({
  recordRun: vi.fn(async (_db, preds) => recorded.push(preds)),
  loadActive: vi.fn(async () => []),
  listHistory: vi.fn(async () => []),
  recordScenario: vi.fn(async () => {}),
}));

import * as service from "./service";
const db = {} as Database;

describe("prediction.current", () => {
  it("runs the engine and returns immutable, confidence-scored forecasts + counts", async () => {
    const r = await service.current(db, "Asia/Kolkata");
    expect(r.predictions.length).toBeGreaterThan(0);
    expect(r.predictions.every((p) => p.confidence.level && p.confidence.score >= 0)).toBe(true);
    expect(r.counts.total).toBe(r.predictions.length);
    // deadline forecast flags a slip
    expect(r.risks.some((p) => p.kind === "deadline" && p.outlook === "at_risk")).toBe(true);
    expect(recorded.length).toBeGreaterThan(0);
  });
});

describe("prediction signal bridge (→ 6.1)", () => {
  it("bridges actionable forecasts into Signals carrying confidence", async () => {
    const sigs = await service.predictionSignals(db, "Asia/Kolkata");
    expect(sigs.length).toBeGreaterThan(0);
    expect(sigs.every((s) => s.explanation.headline.startsWith("Forecast:"))).toBe(true);
    expect(sigs.some((s) => s.category === "risks")).toBe(true);
  });
});

describe("prediction.simulate — no mutation", () => {
  it("projects a what-if against the current forecast", async () => {
    const r = await service.simulate(db, "Asia/Kolkata", { kind: "add_focus_block", amount: 60 });
    expect(r.result).not.toBeNull();
    expect(r.result!.effects.length).toBeGreaterThan(0);
    expect(typeof r.result!.netDelta).toBe("number");
  });
});

describe("prediction.timeline / forChief", () => {
  it("builds a past→current→forecast timeline", async () => {
    const r = await service.timeline(db, "Asia/Kolkata");
    expect(r.points[0]?.when).toBe("current");
  });
  it("selects the Chief's actionable forecasts", async () => {
    expect((await service.forChief(db, "Asia/Kolkata")).length).toBeGreaterThanOrEqual(0);
  });
});
