import { beforeEach, describe, expect, it, vi } from "vitest";

// TomorrowService is server-only; mock every upstream engine service + the
// tomorrow repository, and verify the deterministic context assembly + wiring.
const h = vi.hoisted(() => ({
  taskList: vi.fn(),
  calendarList: vi.fn(),
  inboxList: vi.fn(),
  decisionList: vi.fn(),
  projectSignals: vi.fn(),
  healthSignals: vi.fn(),
  getMetrics: vi.fn(),
  goalPortfolio: vi.fn(),
  journalSignals: vi.fn(),
  // repository
  getPlan: vi.fn(),
  upsertPlan: vi.fn(),
  setPlanStatus: vi.fn(),
  listPriorities: vi.fn(),
  replacePriorities: vi.fn(),
  listChecklist: vi.fn(),
  seedChecklist: vi.fn(),
  setChecklistItem: vi.fn(),
  upsertReview: vi.fn(),
  recentReviews: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../task/service", () => ({ list: h.taskList }));
vi.mock("../calendar/service", () => ({ list: h.calendarList }));
vi.mock("../inbox/service", () => ({ list: h.inboxList }));
vi.mock("../decision/service", () => ({ list: h.decisionList }));
vi.mock("../project/service", () => ({ signals: h.projectSignals }));
vi.mock("../health/signals", () => ({ healthSignals: h.healthSignals }));
vi.mock("../today/service", () => ({ getMetrics: h.getMetrics }));
vi.mock("../goal/summary", () => ({ portfolio: h.goalPortfolio }));
vi.mock("../journal/summary", () => ({ signals: h.journalSignals }));
vi.mock("./repository", () => h);

import * as service from "./service";

const db = {} as never;
const TZ = "UTC";
const D = (s: string) => new Date(s);

function task(over: Record<string, unknown> = {}) {
  return {
    id: "t1",
    title: "Ship v2",
    status: "in_progress",
    priority: "high",
    estimatedMinutes: 60,
    actualMinutes: null,
    dueAt: null,
    scheduledStart: null,
    scheduledEnd: null,
    completedAt: null,
    parentTaskId: null,
    projectId: "pr1",
    milestoneId: null,
    objectiveId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.taskList.mockResolvedValue([
    task({ id: "t1", title: "Ship v2", priority: "high", dueAt: "2000-01-01T00:00:00.000Z" }),
    task({ id: "t2", title: "Refactor", priority: "medium" }),
    task({ id: "t3", title: "Done thing", completedAt: "2026-06-01T00:00:00.000Z" }),
  ]);
  h.calendarList.mockResolvedValue([
    {
      id: "e1",
      title: "Standup",
      startAt: "2030-01-02T09:00:00.000Z",
      endAt: "2030-01-02T09:30:00.000Z",
      allDay: false,
    },
    {
      id: "e2",
      title: "Holiday",
      startAt: "2030-01-02T00:00:00.000Z",
      endAt: "2030-01-02T23:59:00.000Z",
      allDay: true,
    },
  ]);
  h.inboxList.mockResolvedValue([{ id: "i1", title: "Read spec", content: "" }]);
  h.decisionList.mockResolvedValue([
    { id: "d1", title: "Pick vendor", state: "pending" },
    { id: "d2", title: "Adopt X", state: "accepted" },
  ]);
  h.projectSignals.mockResolvedValue({
    topProjectName: "Campus AI",
    criticalMilestones: [{ projectName: "Campus AI", title: "Alpha", dueInDays: 2 }],
    atRiskCount: 1,
  });
  h.healthSignals.mockResolvedValue({
    readiness: 78,
    lowSleep: false,
    highReadiness: false,
    recovery: "recovering",
  });
  h.getMetrics.mockResolvedValue({ completedTasks: 6, deepWorkMinutes: 150, plannerAccuracy: 80 });
  h.goalPortfolio.mockResolvedValue({
    activeCount: 3,
    overallProgress: 65,
    behindCount: 1,
    habitStreak: 4,
    nextMilestone: null,
  });
  h.journalSignals.mockResolvedValue({ writingStreak: 5, loggedToday: true });

  h.upsertPlan.mockResolvedValue({
    id: "plan1",
    planningDate: "2026-07-07",
    targetDate: "2026-07-08",
    status: "draft",
    completed: false,
    createdAt: D("2026-07-07"),
    updatedAt: D("2026-07-07"),
  });
  h.seedChecklist.mockResolvedValue([]);
  h.listChecklist.mockResolvedValue([
    { id: "c1", item: "Review inbox", completed: false, required: true },
    { id: "c2", item: "Set priorities", completed: false, required: true },
  ]);
  h.listPriorities.mockResolvedValue([]);
});

describe("buildContext", () => {
  it("assembles review from today metrics + engines", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.review.tasksCompleted).toBe(6);
    expect(ctx.review.deepWorkMinutes).toBe(150);
    expect(ctx.review.plannerAccuracy).toBe(80);
    expect(ctx.review.goalProgress).toBe(65);
    expect(ctx.review.healthReadiness).toBe(78);
    expect(ctx.review.journalCompleted).toBe(true);
    expect(ctx.review.decisionsAccepted).toBe(1);
  });

  it("collects carry-forward from overdue tasks, milestones, decisions + inbox", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    const kinds = ctx.carryForwardCandidates.map((c) => c.kind);
    expect(kinds).toContain("task"); // t1 overdue
    expect(kinds).toContain("milestone");
    expect(kinds).toContain("decision"); // d1 pending
    expect(kinds).toContain("inbox");
    // t2 (not overdue) + accepted decision are NOT carry-forward
    expect(ctx.carryForwardCandidates.filter((c) => c.kind === "decision")).toHaveLength(1);
  });

  it("ranks priority candidates from open tasks", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.priorityCandidates.length).toBeGreaterThan(0);
    const top = ctx.priorityCandidates[0]!;
    expect(top.taskPriority).toBe(2); // high task first (t1)
    expect(top.projectUrgency).toBe(2); // has projectId
  });

  it("mirrors tomorrow's calendar + computes meeting minutes", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.calendar).toHaveLength(2);
    expect(ctx.calendar.find((e) => e.id === "e2")!.kind).toBe("event"); // all-day
    expect(ctx.readiness.meetingMinutes).toBe(30); // only the 30m standup
  });

  it("targets tomorrow", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.targetDate > ctx.planningDate).toBe(true);
  });

  it("degrades gracefully when a service throws", async () => {
    h.getMetrics.mockRejectedValue(new Error("db down"));
    h.healthSignals.mockRejectedValue(new Error("db down"));
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.review.tasksCompleted).toBe(0);
    expect(ctx.review.healthReadiness).toBe(0);
  });

  it("excludes completed tasks from carry-forward + priorities", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.priorityCandidates.some((p) => p.entityId === "t3")).toBe(false);
    expect(ctx.carryForwardCandidates.some((c) => c.entityId === "t3")).toBe(false);
  });

  it("only overdue tasks carry forward", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    const taskItems = ctx.carryForwardCandidates.filter((c) => c.kind === "task");
    expect(taskItems).toHaveLength(1); // t1 overdue; t2 not
    expect(taskItems[0]!.entityId).toBe("t1");
  });

  it("derives expected workload from estimates", async () => {
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.readiness.expectedWorkloadMinutes).toBeGreaterThan(0);
  });

  it("caps priority candidates at twelve", async () => {
    h.taskList.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => task({ id: `t${i}`, title: `T${i}` })),
    );
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.priorityCandidates.length).toBeLessThanOrEqual(12);
  });

  it("is calendar-empty safe", async () => {
    h.calendarList.mockResolvedValue([]);
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.calendar).toHaveLength(0);
    expect(ctx.readiness.meetingMinutes).toBe(0);
  });

  it("carries only new inbox items", async () => {
    h.inboxList.mockResolvedValue([
      { id: "i1", title: "A", content: "" },
      { id: "i2", title: "B", content: "" },
    ]);
    const ctx = await service.buildContext(db, TZ, D("2026-07-07T20:00:00Z"));
    expect(ctx.carryForwardCandidates.filter((c) => c.kind === "inbox")).toHaveLength(2);
  });

  it("counts tasks created today for the review", async () => {
    const todayISO = new Date().toISOString();
    h.taskList.mockResolvedValue([
      task({ id: "t1", createdAt: todayISO }),
      task({ id: "t2", createdAt: "2020-01-01T00:00:00.000Z" }),
    ]);
    const ctx = await service.buildContext(db, TZ);
    expect(ctx.review.tasksCreated).toBe(1);
  });
});

describe("workflow operations", () => {
  it("get returns plan + assembled state + saved priorities", async () => {
    const out = await service.get(db, TZ);
    expect(out.plan.id).toBe("plan1");
    expect(out.state.carryForward.total).toBeGreaterThan(0);
    expect(out.state.priorities.top.length).toBeGreaterThan(0);
    expect(out.savedPriorities).toEqual([]);
  });

  it("review resolves the day summary", async () => {
    expect((await service.review(db, TZ)).completionScore).toBeGreaterThanOrEqual(0);
  });
  it("carryForward lists unfinished work", async () => {
    expect((await service.carryForward(db, TZ)).total).toBeGreaterThan(0);
  });
  it("priorities ranks the top three", async () => {
    expect((await service.priorities(db, TZ)).top.length).toBeGreaterThan(0);
  });
  it("readiness computes a score", async () => {
    expect((await service.readiness(db, TZ)).score).toBeGreaterThanOrEqual(0);
  });

  it("savePriorities replaces + returns saved rows", async () => {
    h.replacePriorities.mockResolvedValue([
      {
        id: "sp1",
        planId: "plan1",
        priorityOrder: 0,
        taskId: "t1",
        projectId: null,
        goalId: null,
        title: "Ship v2",
      },
    ]);
    const saved = await service.savePriorities(db, TZ, [{ title: "Ship v2", taskId: "t1" }]);
    expect(saved).toHaveLength(1);
    expect(h.replacePriorities).toHaveBeenCalled();
  });

  it("checklist reflects persisted items", async () => {
    const c = await service.checklist(db, TZ);
    expect(c.total).toBe(2);
    expect(c.allRequiredDone).toBe(false);
  });

  it("toggleChecklist flips an item then recomputes", async () => {
    h.setChecklistItem.mockResolvedValue({
      id: "c1",
      item: "Review inbox",
      completed: true,
      required: true,
    });
    h.listChecklist.mockResolvedValue([
      { id: "c1", item: "Review inbox", completed: true, required: true },
      { id: "c2", item: "Set priorities", completed: true, required: true },
    ]);
    const c = await service.toggleChecklist(db, TZ, "c1", true);
    expect(c.allRequiredDone).toBe(true);
  });

  it("finalize marks the plan planned + completed", async () => {
    h.setPlanStatus.mockImplementation((_db, _id, status, completed) =>
      Promise.resolve({
        id: "plan1",
        planningDate: "2026-07-07",
        targetDate: "2026-07-08",
        status,
        completed,
        createdAt: D("2026-07-07"),
        updatedAt: D("2026-07-07"),
      }),
    );
    const p = await service.finalize(db, TZ);
    expect(p.status).toBe("planned");
    expect(p.completed).toBe(true);
  });
  it("lock sets locked", async () => {
    h.setPlanStatus.mockImplementation((_db, _id, status, completed) =>
      Promise.resolve({
        id: "plan1",
        planningDate: "2026-07-07",
        targetDate: "2026-07-08",
        status,
        completed,
        createdAt: D("2026-07-07"),
        updatedAt: D("2026-07-07"),
      }),
    );
    expect((await service.lock(db, TZ)).status).toBe("locked");
  });
  it("reopen returns to draft", async () => {
    h.setPlanStatus.mockImplementation((_db, _id, status, completed) =>
      Promise.resolve({
        id: "plan1",
        planningDate: "2026-07-07",
        targetDate: "2026-07-08",
        status,
        completed,
        createdAt: D("2026-07-07"),
        updatedAt: D("2026-07-07"),
      }),
    );
    const p = await service.reopen(db, TZ);
    expect(p.status).toBe("draft");
    expect(p.completed).toBe(false);
  });

  it("ensurePlan upserts + seeds the checklist", async () => {
    await service.ensurePlan(db, TZ);
    expect(h.upsertPlan).toHaveBeenCalled();
    expect(h.seedChecklist).toHaveBeenCalled();
  });

  it("savePriorities caps at the chosen list", async () => {
    h.replacePriorities.mockResolvedValue([]);
    await service.savePriorities(db, TZ, []);
    const rows = h.replacePriorities.mock.calls[0]![2];
    expect(rows).toHaveLength(0);
  });

  it("signals flag a heavy meeting day", async () => {
    h.calendarList.mockResolvedValue([
      {
        id: "m1",
        title: "All hands",
        startAt: "2030-01-02T09:00:00.000Z",
        endAt: "2030-01-02T13:00:00.000Z",
        allDay: false,
      },
    ]);
    const s = await service.signals(db, TZ);
    expect(s.heavyMeetingDay).toBe(true);
  });

  it("signals flag too much unfinished work", async () => {
    h.taskList.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) =>
        task({ id: `t${i}`, title: `T${i}`, dueAt: "2000-01-01T00:00:00.000Z" }),
      ),
    );
    const s = await service.signals(db, TZ);
    expect(s.tooMuchUnfinished).toBe(true);
  });

  it("counts summarises for the status bar", async () => {
    const c = await service.counts(db, TZ);
    expect(c.priorityCount).toBeGreaterThan(0);
    expect(c.carryForwardCount).toBeGreaterThan(0);
    expect(typeof c.ready).toBe("boolean");
  });

  it("signals expose decision inputs", async () => {
    const s = await service.signals(db, TZ);
    expect(typeof s.tooMuchUnfinished).toBe("boolean");
    expect(typeof s.heavyMeetingDay).toBe("boolean");
    expect(typeof s.lowReadiness).toBe("boolean");
  });

  it("get exposes the assembled review headline", async () => {
    const out = await service.get(db, TZ);
    expect(out.state.review.headline).toBeTruthy();
    expect(out.state.recommendations.length).toBeGreaterThan(0);
  });
});
