import { describe, expect, it } from "vitest";
import { at, iso, makeMilestone, makeObjective, makeProject, makeTask } from "./fixtures";
import { calculateProgress } from "./progress";

describe("progress", () => {
  const now = at(2026, 6, 10);

  it("derives task completion percent", () => {
    const project = makeProject({ id: "p1" });
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "not_started" }),
      makeTask({ id: "c", projectId: "p1", status: "in_progress" }),
      makeTask({ id: "d", projectId: "p1", status: "not_started" }),
    ];
    expect(calculateProgress(project, tasks, now).tasksPercent).toBe(25);
  });

  it("only counts tasks owned by the project", () => {
    const project = makeProject({ id: "p1" });
    const tasks = [makeTask({ id: "a", projectId: "p2", status: "completed" })];
    const p = calculateProgress(project, tasks, now);
    expect(p.totalTasks).toBe(0);
    expect(p.tasksPercent).toBe(0);
  });

  it("derives milestone completion percent", () => {
    const project = makeProject({
      id: "p1",
      milestones: [makeMilestone({ completed: true }), makeMilestone({ completed: false })],
    });
    expect(calculateProgress(project, [], now).milestonesPercent).toBe(50);
  });

  it("derives objective percent", () => {
    const project = makeProject({
      id: "p1",
      objectives: [makeObjective({ currentValue: 5, targetValue: 10 })],
    });
    expect(calculateProgress(project, [], now).objectivesPercent).toBe(50);
  });

  it("derives schedule adherence from elapsed time", () => {
    const project = makeProject({
      id: "p1",
      startDate: iso(2026, 6, 0),
      targetDate: iso(2026, 6, 20),
    });
    // now (Jul 10 09:00) sits ~51.9% through the Jun 30 → Jul 20 window.
    expect(calculateProgress(project, [], now).schedulePercent).toBe(52);
  });

  it("weights the four inputs into an overall score", () => {
    const project = makeProject({
      id: "p1",
      startDate: iso(2026, 6, 0),
      targetDate: iso(2026, 6, 20),
      milestones: [makeMilestone({ completed: true })],
      objectives: [makeObjective({ currentValue: 10, targetValue: 10, completed: true })],
    });
    const tasks = [makeTask({ id: "a", projectId: "p1", status: "completed" })];
    // tasks 100*0.4 + milestones 100*0.3 + objectives 100*0.2 + schedule ~52*0.1 ≈ 95
    expect(calculateProgress(project, tasks, now).overall).toBe(95);
  });

  it("reports 100% overall for a completed project", () => {
    const project = makeProject({ id: "p1", status: "completed" });
    expect(calculateProgress(project, [], now).overall).toBe(100);
  });

  it("returns zeros for an empty project", () => {
    const p = calculateProgress(makeProject({ id: "p1" }), [], now);
    expect(p.overall).toBe(0);
    expect(p.totalMilestones).toBe(0);
  });

  it("scores schedule adherence at 0 without both dates", () => {
    const project = makeProject({ id: "p1", startDate: iso(2026, 6, 1), targetDate: null });
    expect(calculateProgress(project, [], now).schedulePercent).toBe(0);
  });

  it("reports counts alongside percentages", () => {
    const project = makeProject({ id: "p1", milestones: [makeMilestone({ completed: true })] });
    const tasks = [
      makeTask({ id: "a", projectId: "p1", status: "completed" }),
      makeTask({ id: "b", projectId: "p1", status: "not_started" }),
    ];
    const p = calculateProgress(project, tasks, now);
    expect(p.completedTasks).toBe(1);
    expect(p.totalTasks).toBe(2);
    expect(p.completedMilestones).toBe(1);
  });
});
