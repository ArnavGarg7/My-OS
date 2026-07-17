import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  GoalLinkRow,
  GoalObjectiveRow,
  GoalReviewRow,
  GoalRow,
  HabitRow,
  KeyResultRow,
} from "@myos/db/schema";

// GoalService is server-only; mock the DB boundary (repository) and verify the
// engine wiring — hydration, progress, habits, reviews, links + portfolio.
const h = vi.hoisted(() => ({
  listGoals: vi.fn(),
  getGoal: vi.fn(),
  insertGoal: vi.fn(),
  updateGoal: vi.fn(),
  listObjectives: vi.fn(),
  insertObjective: vi.fn(),
  setObjectiveStatus: vi.fn(),
  listKeyResults: vi.fn(),
  getKeyResult: vi.fn(),
  insertKeyResult: vi.fn(),
  updateKeyResultRow: vi.fn(),
  listHabits: vi.fn(),
  getHabit: vi.fn(),
  insertHabit: vi.fn(),
  updateHabitRow: vi.fn(),
  listReviews: vi.fn(),
  insertReview: vi.fn(),
  listLinks: vi.fn(),
  insertLink: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";
import * as summary from "./summary";

const db = {} as never;
const D = (s: string) => new Date(s);

function goalRow(over: Partial<GoalRow> = {}): GoalRow {
  return {
    id: "g1",
    title: "Graduate",
    description: "",
    goalType: "education",
    status: "active",
    priority: "high",
    targetDate: "2026-12-31",
    startedAt: D("2026-01-01T00:00:00Z"),
    completedAt: null,
    parentGoal: null,
    visionCategory: null,
    reviewFrequency: null,
    createdAt: D("2026-01-01T00:00:00Z"),
    updatedAt: D("2026-01-01T00:00:00Z"),
    ...over,
  };
}

function objectiveRow(over: Partial<GoalObjectiveRow> = {}): GoalObjectiveRow {
  return {
    id: "o1",
    goalId: "g1",
    title: "Excel",
    description: "",
    weight: 1,
    status: "active",
    createdAt: D("2026-01-01T00:00:00Z"),
    updatedAt: D("2026-01-01T00:00:00Z"),
    ...over,
  };
}

function krRow(over: Partial<KeyResultRow> = {}): KeyResultRow {
  return {
    id: "kr1",
    objectiveId: "o1",
    title: "CGPA",
    metricType: "percentage",
    currentValue: 60,
    targetValue: 100,
    unit: "",
    status: "active",
    ...over,
  };
}

function habitRow(over: Partial<HabitRow> = {}): HabitRow {
  return {
    id: "h1",
    goalId: "g1",
    title: "Study",
    frequency: "daily",
    target: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastCompleted: null,
    active: true,
    history: [],
    ...over,
  };
}

function reviewRow(over: Partial<GoalReviewRow> = {}): GoalReviewRow {
  return {
    id: "rv1",
    goalId: "g1",
    reviewPeriod: "quarterly",
    summary: "ok",
    progressSnapshot: 50,
    reviewedAt: D("2026-03-25T00:00:00Z"),
    ...over,
  };
}

function linkRow(over: Partial<GoalLinkRow> = {}): GoalLinkRow {
  return {
    id: "l1",
    goalId: "g1",
    projectId: null,
    taskId: null,
    journalEntryId: null,
    financeGoalId: null,
    healthMetric: null,
    createdAt: D("2026-01-01T00:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.listGoals.mockResolvedValue([]);
  h.listObjectives.mockResolvedValue([]);
  h.listKeyResults.mockResolvedValue([]);
  h.listHabits.mockResolvedValue([]);
  h.listLinks.mockResolvedValue([]);
  h.listReviews.mockResolvedValue([]);
});

describe("goals", () => {
  it("creates + validates a goal", async () => {
    h.insertGoal.mockResolvedValue(goalRow());
    const g = await service.create(db, {
      title: "Graduate",
      goalType: "education",
      priority: "high",
      targetDate: null,
    });
    expect(g.title).toBe("Graduate");
    expect(h.insertGoal).toHaveBeenCalledOnce();
  });

  it("hydrates a goal with objectives, key results, habits + links", async () => {
    h.listGoals.mockResolvedValue([goalRow()]);
    h.listObjectives.mockResolvedValue([objectiveRow()]);
    h.listKeyResults.mockResolvedValue([krRow({ currentValue: 100 })]);
    h.listHabits.mockResolvedValue([habitRow()]);
    h.listLinks.mockResolvedValue([linkRow({ projectId: "p1" })]);
    const [g] = await service.list(db);
    expect(g?.objectives[0]?.keyResults).toHaveLength(1);
    expect(g?.habits).toHaveLength(1);
    expect(g?.links).toEqual([{ target: "project", targetId: "p1" }]);
  });

  it("throws when a goal is missing", async () => {
    h.getGoal.mockResolvedValue(undefined);
    await expect(service.get(db, "nope")).rejects.toThrow(/not found/);
  });

  it("applies a status transition through the engine", async () => {
    h.getGoal.mockResolvedValue(goalRow({ status: "active" }));
    h.updateGoal.mockResolvedValue(
      goalRow({ status: "completed", completedAt: D("2026-06-01T00:00:00Z") }),
    );
    const g = await service.update(db, { id: "g1", status: "completed" });
    expect(g.status).toBe("completed");
    const persisted = h.updateGoal.mock.calls[0]?.[1] as { completedAt: Date | null };
    expect(persisted.completedAt).not.toBeNull();
  });

  it("archives a goal", async () => {
    h.updateGoal.mockResolvedValue(goalRow({ status: "archived" }));
    expect((await service.archive(db, "g1")).status).toBe("archived");
  });
});

describe("objectives + key results", () => {
  it("creates an objective", async () => {
    h.insertObjective.mockResolvedValue(objectiveRow());
    const o = await service.createObjective(db, { goalId: "g1", title: "Excel", weight: 2 });
    expect(o.title).toBe("Excel");
  });

  it("creates a key result", async () => {
    h.insertKeyResult.mockResolvedValue(krRow());
    const kr = await service.createKeyResult(db, {
      objectiveId: "o1",
      title: "CGPA",
      metricType: "numeric",
      targetValue: 9,
      currentValue: 8,
      unit: "",
    });
    expect(kr.title).toBe("CGPA");
  });

  it("updates a key result value and auto-completes at target", async () => {
    h.getKeyResult.mockResolvedValue(
      krRow({ metricType: "numeric", currentValue: 5, targetValue: 9 }),
    );
    h.updateKeyResultRow.mockImplementation((_db: never, _id: string, patch: never) =>
      Promise.resolve(krRow({ ...(patch as object) } as Partial<KeyResultRow>)),
    );
    const kr = await service.updateKeyResultValue(db, { id: "kr1", currentValue: 9 });
    expect(kr.status).toBe("completed");
  });
});

describe("habits", () => {
  it("creates a habit", async () => {
    h.insertHabit.mockResolvedValue(habitRow());
    const habit = await service.createHabit(db, {
      goalId: "g1",
      title: "Study",
      frequency: "daily",
      target: 1,
    });
    expect(habit.title).toBe("Study");
  });

  it("completes a habit, updating streak + history", async () => {
    h.getHabit.mockResolvedValue(habitRow({ history: ["2026-07-06"] }));
    h.updateHabitRow.mockImplementation((_db: never, _id: string, patch: never) =>
      Promise.resolve(habitRow({ ...(patch as object) } as Partial<HabitRow>)),
    );
    const habit = await service.completeHabit(db, { id: "h1", date: "2026-07-07" }, "UTC");
    expect(habit.history).toContain("2026-07-07");
    expect(habit.currentStreak).toBe(2);
  });
});

describe("reviews + links", () => {
  it("creates a review with a progress snapshot", async () => {
    h.getGoal.mockResolvedValue(goalRow());
    h.listObjectives.mockResolvedValue([objectiveRow()]);
    h.listKeyResults.mockResolvedValue([krRow({ currentValue: 60 })]);
    h.insertReview.mockImplementation(
      (_db: never, v: { progressSnapshot: number; summary: string }) =>
        Promise.resolve(reviewRow({ progressSnapshot: v.progressSnapshot, summary: v.summary })),
    );
    const r = await service.createGoalReview(db, { goalId: "g1", reviewPeriod: "quarterly" });
    expect(r.progressSnapshot).toBeGreaterThan(0);
    expect(r.summary).toContain("Quarterly review");
  });

  it("adds a columnar link", async () => {
    h.insertLink.mockResolvedValue(linkRow());
    await service.addLink(db, { goalId: "g1", target: "project", targetId: "p1" });
    expect(h.insertLink).toHaveBeenCalledWith(db, {
      goalId: "g1",
      projectId: "p1",
      taskId: null,
      journalEntryId: null,
      financeGoalId: null,
      healthMetric: null,
    });
  });
});

describe("portfolio + signals + search", () => {
  it("builds a portfolio", async () => {
    h.listGoals.mockResolvedValue([goalRow({ id: "a" }), goalRow({ id: "b", status: "archived" })]);
    h.listObjectives.mockResolvedValue([objectiveRow({ goalId: "a" })]);
    h.listKeyResults.mockResolvedValue([krRow({ currentValue: 80 })]);
    const p = await summary.portfolio(db);
    expect(p.activeCount).toBe(1);
    expect(p.overallProgress).toBe(80);
  });

  it("derives signals", async () => {
    h.listGoals.mockResolvedValue([goalRow()]);
    const sig = await summary.signals(db);
    expect(sig).toHaveProperty("activeCount");
    expect(sig).toHaveProperty("bestHabitStreak");
  });

  it("searches goals by title", async () => {
    h.listGoals.mockResolvedValue([
      goalRow({ id: "a", title: "Graduate" }),
      goalRow({ id: "b", title: "Run a marathon" }),
    ]);
    const results = await summary.search(db, "marathon");
    expect(results.map((g) => g.id)).toEqual(["b"]);
  });

  it("counts goals + habits", async () => {
    h.listGoals.mockResolvedValue([goalRow()]);
    h.listHabits.mockResolvedValue([habitRow()]);
    const c = await summary.counts(db);
    expect(c.goals).toBe(1);
    expect(c.active).toBe(1);
    expect(c.habits).toBe(1);
  });
});
