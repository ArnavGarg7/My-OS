import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TimelineEventRow } from "@myos/db/schema";

// AnalyticsService is server-only; mock the timeline repository + each domain
// summary boundary and verify the context assembly + engine wiring.
const h = vi.hoisted(() => ({
  allEvents: vi.fn(),
  buildHealthSummary: vi.fn(),
  financeSummary: vi.fn(),
  goalPortfolio: vi.fn(),
  projectSignals: vi.fn(),
  journalSignals: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../timeline/repository", () => ({ allEvents: h.allEvents }));
vi.mock("../health/summary", () => ({ buildSummary: h.buildHealthSummary }));
vi.mock("../finance/summary", () => ({ summary: h.financeSummary }));
vi.mock("../goal/summary", () => ({ portfolio: h.goalPortfolio }));
vi.mock("../project/service", () => ({ signals: h.projectSignals }));
vi.mock("../journal/summary", () => ({ signals: h.journalSignals }));

import * as service from "./service";
import * as reviews from "./reviews";
import * as summaryFacade from "./summary";

const db = {} as never;
const TZ = "Asia/Kolkata";
const D = (s: string) => new Date(s);

function eventRow(over: Partial<TimelineEventRow> = {}): TimelineEventRow {
  return {
    id: "e1",
    eventType: "task.completed",
    sourceModule: "task",
    entityId: null,
    title: "Did a thing",
    summary: "Did a thing",
    timestamp: D("2026-07-06T09:00:00Z"),
    importance: 40,
    metadata: {},
    createdAt: D("2026-07-06T09:00:00Z"),
    ...over,
  };
}

function healthSummary() {
  return {
    readiness: { score: 82 },
    sleep: { durationMinutes: 440 },
    hydration: { completionPercent: 90 },
    recovery: { score: 80 },
    workouts: { count: 3 },
  };
}
function finSummary() {
  return {
    cashFlow: { income: 40000, expenses: 25000, net: 15000, direction: "positive" },
    overallBudgetPercent: 60,
    subscriptions: { monthlyRecurring: 900 },
  };
}
function goalPort() {
  return {
    activeCount: 3,
    overallProgress: 70,
    behindCount: 1,
    habitStreak: 4,
    nextMilestone: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.allEvents.mockResolvedValue([
    eventRow({
      id: "a",
      eventType: "task.completed",
      timestamp: D("2026-07-06T09:00:00Z"),
      metadata: { focusMinutes: 120 },
    }),
    eventRow({
      id: "b",
      eventType: "task.completed",
      timestamp: D("2026-07-06T11:00:00Z"),
      metadata: { focusMinutes: 60 },
    }),
    eventRow({
      id: "c",
      eventType: "decision.accepted",
      sourceModule: "decision",
      title: "Ship",
      timestamp: D("2026-07-06T10:00:00Z"),
    }),
    eventRow({
      id: "d",
      eventType: "habit.completed",
      sourceModule: "goal",
      title: "Meditate",
      timestamp: D("2026-07-05T07:00:00Z"),
    }),
  ]);
  h.buildHealthSummary.mockResolvedValue(healthSummary());
  h.financeSummary.mockResolvedValue(finSummary());
  h.goalPortfolio.mockResolvedValue(goalPort());
  h.projectSignals.mockResolvedValue({
    topProjectName: null,
    criticalMilestones: [],
    atRiskCount: 1,
  });
  h.journalSignals.mockResolvedValue({ writingStreak: 5, loggedToday: true });
});

const NOW = D("2026-07-07T18:00:00Z");

describe("buildContext", () => {
  it("assembles events + domain snapshots", async () => {
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.events).toHaveLength(4);
    expect(ctx.health?.avgReadiness).toBe(82);
    expect(ctx.finance?.totalIncome).toBe(40000);
    expect(ctx.finance?.budgetAdherence).toBe(40); // 100 - 60
    expect(ctx.goals?.activeCount).toBe(3);
    expect(ctx.goals?.habitConsistency).toBe(80); // streak 4 * 20
    expect(ctx.journal?.writingStreak).toBe(5);
    expect(ctx.projects?.atRisk).toBe(1);
  });

  it("degrades gracefully when a summary throws", async () => {
    h.buildHealthSummary.mockRejectedValue(new Error("boom"));
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.health).toBeUndefined();
    expect(ctx.events).toHaveLength(4);
  });

  it("computes savings rate from cash flow", async () => {
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.finance?.savingsRate).toBe(38); // 15000/40000 = 37.5 → 38
  });
});

describe("summary + domain endpoints", () => {
  it("summary bundles scores + metrics", async () => {
    const s = await service.summary(db, TZ, "weekly", NOW);
    expect(s.reportType).toBe("weekly");
    expect(s.scores.overall).toBeGreaterThan(0);
    expect(s.productivity.tasksCompleted).toBe(2);
    expect(s.timeline.totalEvents).toBeGreaterThan(0);
  });

  it("productivity reflects completed tasks + deep work", async () => {
    const p = await service.productivity(db, TZ, "weekly", NOW);
    expect(p.tasksCompleted).toBe(2);
    expect(p.deepWorkMinutes).toBe(180);
    expect(p.decisionsCompleted).toBe(1);
  });

  it("focus reports deep-work blocks", async () => {
    const f = await service.focus(db, TZ, "weekly", NOW);
    expect(f.focusBlocks).toBe(2);
    expect(f.longestBlockMinutes).toBe(120);
  });

  it("planner reads the snapshot (defaults to zero)", async () => {
    expect((await service.planner(db, TZ)).accuracy).toBe(0);
  });

  it("calendar reports focus hours", async () => {
    expect((await service.calendar(db, TZ)).focusHours).toBeGreaterThanOrEqual(0);
  });
  it("health scores from the summary", async () => {
    const m = await service.health(db, TZ);
    expect(m.score).toBeGreaterThan(0);
    expect(m.avgReadiness).toBe(82);
  });
  it("finance scores from budget + savings", async () => {
    const m = await service.finance(db, TZ);
    expect(m.score).toBeGreaterThan(0);
    expect(m.netCashFlow).toBe(15000);
  });
  it("goals reads the portfolio", async () => {
    expect((await service.goals(db, TZ)).activeCount).toBe(3);
  });
  it("projects reads at-risk from signals", async () => {
    expect((await service.projects(db, TZ)).atRisk).toBe(1);
  });
  it("journal reads the writing streak", async () => {
    expect((await service.journal(db, TZ)).writingStreak).toBe(5);
  });
  it("timeline totals events", async () => {
    expect((await service.timeline(db, TZ, "weekly", NOW)).totalEvents).toBeGreaterThan(0);
  });
  it("supports a monthly period", async () => {
    expect((await service.summary(db, TZ, "monthly")).reportType).toBe("monthly");
  });
});

describe("edge cases", () => {
  it("handles an empty timeline", async () => {
    h.allEvents.mockResolvedValue([]);
    const s = await service.summary(db, TZ, "weekly");
    expect(s.timeline.totalEvents).toBe(0);
    expect(s.productivity.tasksCompleted).toBe(0);
  });
  it("zeroes savings rate when there is no income", async () => {
    h.financeSummary.mockResolvedValue({
      cashFlow: { income: 0, expenses: 500, net: -500, direction: "negative" },
      overallBudgetPercent: 120,
      subscriptions: { monthlyRecurring: 0 },
    });
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.finance?.savingsRate).toBe(0);
    expect(ctx.finance?.budgetAdherence).toBe(0); // clamped from 100 - 120
  });
  it("derives goal completion rate from behind count", async () => {
    const ctx = await service.buildContext(db, TZ, NOW);
    // (3 active - 1 behind) / 3 = 67%
    expect(ctx.goals?.completionRate).toBe(67);
  });
  it("still builds projects/journal snapshots when their sources are null", async () => {
    h.projectSignals.mockResolvedValue(null);
    h.journalSignals.mockResolvedValue(null);
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.projects?.atRisk).toBe(0);
    expect(ctx.journal?.writingStreak).toBe(0);
  });

  it("omits finance when its summary fails", async () => {
    h.financeSummary.mockRejectedValue(new Error("db down"));
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.finance).toBeUndefined();
  });

  it("caps habit consistency at 100 for long streaks", async () => {
    h.goalPortfolio.mockResolvedValue({
      activeCount: 2,
      overallProgress: 60,
      behindCount: 0,
      habitStreak: 10,
      nextMilestone: null,
    });
    const ctx = await service.buildContext(db, TZ, NOW);
    expect(ctx.goals?.habitConsistency).toBe(100);
  });

  it("forecasts over a custom horizon", async () => {
    const f = await service.forecast(db, TZ, 30);
    expect(f.horizonDays).toBe(30);
  });

  it("compares day-over-day", async () => {
    const c = await service.compare(db, TZ, "previous_day");
    expect(c.period).toBe("previous_day");
  });
});

describe("trends, comparisons, forecasts + stats", () => {
  it("returns a trend direction", async () => {
    expect(["up", "down", "flat"]).toContain((await service.trend(db, TZ, "week")).direction);
  });
  it("compares periods", async () => {
    expect((await service.compare(db, TZ, "previous_week")).metric).toBe("timeline.events");
  });
  it("forecasts event volume", async () => {
    expect((await service.forecast(db, TZ, 7)).basis).toBe("historical-velocity");
  });
  it("statistics + counts aggregate", async () => {
    expect((await service.statistics(db, TZ)).totalEvents).toBe(4);
    const c = await service.counts(db, TZ);
    expect(c.totalEvents).toBe(4);
    expect(c.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe("reviews", () => {
  it("builds a weekly review with scores + highlights", async () => {
    const r = await reviews.weeklyReview(db, TZ, NOW);
    expect(r.reportType).toBe("weekly");
    expect(r.scores.overall).toBeGreaterThan(0);
    expect(r.highlights.topDecision).toBe("Ship");
  });
  it("builds monthly / quarterly / yearly reviews", async () => {
    expect((await reviews.monthlyReview(db, TZ)).reportType).toBe("monthly");
    expect((await reviews.quarterlyReview(db, TZ)).reportType).toBe("quarterly");
    expect((await reviews.yearlyReview(db, TZ)).reportType).toBe("yearly");
  });
});

describe("summary facade", () => {
  it("dashboard exposes a compact scoreboard + trend", async () => {
    const d = await summaryFacade.dashboard(db, TZ);
    expect(d.scores.overall).toBeGreaterThanOrEqual(0);
    expect(d.trend.direction).toBeDefined();
  });
  it("statusSignal exposes productivity + trend", async () => {
    const s = await summaryFacade.statusSignal(db, TZ);
    expect(s.productivity).toBeGreaterThanOrEqual(0);
    expect(["up", "down", "flat"]).toContain(s.trendDirection);
  });
});
