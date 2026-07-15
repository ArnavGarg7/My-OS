import { describe, expect, it } from "vitest";
import { at, iso, makeProject, makeTask } from "./fixtures";
import { forecast } from "./forecasting";

describe("forecasting", () => {
  const now = at(2026, 6, 11); // 10 days after a Jul 1 start

  const project = makeProject({ id: "p1", startDate: iso(2026, 6, 1) });

  it("computes velocity from completed tasks over elapsed days", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "completed" }),
      makeTask({ id: "c", projectId: "p1", status: "not_started" }),
    ];
    const f = forecast(project, tasks, now);
    expect(f.velocityPerDay).toBeCloseTo(0.2, 5); // 2 done / 10 days
    expect(f.remainingTasks).toBe(1);
  });

  it("estimates a completion date from velocity", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "not_started" }),
    ];
    const f = forecast(project, tasks, now);
    // 0.1/day, 1 remaining → 10 days out from Jul 11.
    expect(f.estimatedCompletion).toBe("2026-07-21");
  });

  it("reports full confidence and today's date when nothing remains", () => {
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "completed" })];
    const f = forecast(project, tasks, now);
    expect(f.remainingTasks).toBe(0);
    expect(f.confidence).toBe(100);
    expect(f.onTrack).toBe(true);
  });

  it("has no estimate when velocity is zero", () => {
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "not_started" })];
    const f = forecast(project, tasks, now);
    expect(f.estimatedCompletion).toBeNull();
    expect(f.onTrack).toBe(false);
  });

  it("predicts a delay against an early target", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "not_started" }),
      makeTask({ id: "c", projectId: "p1", status: "not_started" }),
    ];
    const p = makeProject({ id: "p1", startDate: iso(2026, 6, 1), targetDate: iso(2026, 6, 12) });
    const f = forecast(p, tasks, now);
    expect(f.onTrack).toBe(false);
    expect(f.predictedDelayDays).toBeGreaterThan(0);
    expect(f.bufferDays).toBeGreaterThan(0);
  });

  it("is on track when the estimate beats the target", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "not_started" }),
    ];
    const p = makeProject({ id: "p1", startDate: iso(2026, 6, 1), targetDate: iso(2026, 8, 1) });
    const f = forecast(p, tasks, now);
    expect(f.onTrack).toBe(true);
    expect(f.predictedDelayDays).toBe(0);
    expect(f.bufferDays).toBe(0);
  });

  it("falls back to createdAt when no start date is set", () => {
    const p = makeProject({ id: "p1", startDate: null });
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "completed" })];
    // createdAt is Jul 1 (fixture), so elapsed is still 10 days → velocity 0.1.
    expect(forecast(p, tasks, now).velocityPerDay).toBeCloseTo(0.1, 5);
  });

  it("lowers confidence when a delay is predicted", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "not_started" }),
      makeTask({ id: "c", projectId: "p1", status: "not_started" }),
    ];
    const p = makeProject({ id: "p1", startDate: iso(2026, 6, 1), targetDate: iso(2026, 6, 12) });
    expect(forecast(p, tasks, now).confidence).toBeLessThan(80);
  });

  it("rounds velocity to two decimals", () => {
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "completed" }),
      makeTask({ id: "c", projectId: "p1", status: "completed" }),
    ];
    const f = forecast(project, tasks, now);
    expect(f.velocityPerDay).toBe(0.3);
  });
});
