import { describe, expect, it } from "vitest";
import { calculateProgress } from "./progress";
import { makeTask, dep, at } from "./fixtures";

describe("calculateProgress", () => {
  it("is 0% for a not-started task", () => {
    const p = calculateProgress(makeTask(), [], [], at(10));
    expect(p.completionPercent).toBe(0);
  });

  it("is 100% and 0 remaining when completed", () => {
    const p = calculateProgress(
      makeTask({ status: "completed", estimatedMinutes: 60 }),
      [],
      [],
      at(10),
    );
    expect(p.completionPercent).toBe(100);
    expect(p.remainingMinutes).toBe(0);
  });

  it("derives percent from actual/estimated when in progress", () => {
    const p = calculateProgress(
      makeTask({ status: "in_progress", estimatedMinutes: 100, actualMinutes: 40 }),
      [],
      [],
      at(10),
    );
    expect(p.completionPercent).toBe(40);
    expect(p.remainingMinutes).toBe(60);
  });

  it("caps in-progress percent below 100", () => {
    const p = calculateProgress(
      makeTask({ status: "in_progress", estimatedMinutes: 100, actualMinutes: 200 }),
      [],
      [],
      at(10),
    );
    expect(p.completionPercent).toBe(99);
    expect(p.remainingMinutes).toBe(0);
  });

  it("gives a nominal 10% for in-progress without an estimate", () => {
    const p = calculateProgress(makeTask({ status: "in_progress" }), [], [], at(10));
    expect(p.completionPercent).toBe(10);
    expect(p.remainingMinutes).toBeNull();
  });

  it("flags lateness for an overdue open task", () => {
    const p = calculateProgress(makeTask({ dueAt: at(8).toISOString() }), [], [], at(10));
    expect(p.isLate).toBe(true);
  });

  it("never flags a completed task as late", () => {
    const p = calculateProgress(
      makeTask({ status: "completed", dueAt: at(8).toISOString() }),
      [],
      [],
      at(10),
    );
    expect(p.isLate).toBe(false);
  });

  it("is blocked when a dependency is incomplete", () => {
    const tasks = [makeTask({ id: "a" }), makeTask({ id: "b", status: "in_progress" })];
    const p = calculateProgress(tasks[0]!, [dep("a", "b")], tasks, at(10));
    expect(p.isBlocked).toBe(true);
    expect(p.blockedBy).toEqual(["b"]);
  });

  it("is unblocked when all dependencies are complete", () => {
    const tasks = [makeTask({ id: "a" }), makeTask({ id: "b", status: "completed" })];
    const p = calculateProgress(tasks[0]!, [dep("a", "b")], tasks, at(10));
    expect(p.isBlocked).toBe(false);
    expect(p.blockedBy).toEqual([]);
  });

  it("is blocked when the status itself is blocked", () => {
    const p = calculateProgress(makeTask({ status: "blocked" }), [], [], at(10));
    expect(p.isBlocked).toBe(true);
  });
});
