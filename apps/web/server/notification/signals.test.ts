import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultPreferences, makeNotification } from "@myos/core/notification";

const h = vi.hoisted(() => ({
  listActive: vi.fn(),
  getPreferences: vi.fn(),
  healthSignals: vi.fn(),
  financeSignals: vi.fn(),
  goalSignals: vi.fn(),
  projectSignals: vi.fn(),
  tomorrowCounts: vi.fn(),
  inboxCountNew: vi.fn(),
  focusRecommendations: vi.fn(),
  listBlocks: vi.fn(),
  calendarList: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({ listActive: h.listActive, getPreferences: h.getPreferences }));
vi.mock("../health/signals", () => ({ healthSignals: h.healthSignals }));
vi.mock("../finance/summary", () => ({ signals: h.financeSignals }));
vi.mock("../goal/summary", () => ({ signals: h.goalSignals }));
vi.mock("../project/service", () => ({ signals: h.projectSignals }));
vi.mock("../tomorrow/service", () => ({ counts: h.tomorrowCounts }));
vi.mock("../inbox/service", () => ({ countNew: h.inboxCountNew }));
vi.mock("../focus/service", () => ({ recommendations: h.focusRecommendations }));
vi.mock("../planner/repository", () => ({ listBlocks: h.listBlocks }));
vi.mock("../calendar/service", () => ({ list: h.calendarList }));

import { gatherRuleContext, notificationSignals } from "./signals";

const db = {} as never;
const TZ = "UTC";
const NOW = new Date("2026-07-15T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  h.listActive.mockResolvedValue([]);
  h.getPreferences.mockResolvedValue(defaultPreferences());
  h.healthSignals.mockResolvedValue({ readiness: 80, hydrationPercent: 70, recovery: "high" });
  h.financeSignals.mockResolvedValue({ overBudgetCategories: [], largePaymentDueToday: null });
  h.goalSignals.mockResolvedValue({ behindGoals: [], habitsAtRisk: [], quarterEnding: false });
  h.projectSignals.mockResolvedValue({ criticalMilestones: [] });
  h.tomorrowCounts.mockResolvedValue({
    ready: true,
    priorityCount: 3,
    checklistPercent: 100,
    status: "planned",
  });
  h.inboxCountNew.mockResolvedValue(0);
  h.focusRecommendations.mockResolvedValue([]);
  h.listBlocks.mockResolvedValue([]);
  h.calendarList.mockResolvedValue([]);
});

describe("notificationSignals", () => {
  it("computes decision signals from active notifications", async () => {
    h.listActive.mockResolvedValue([makeNotification({ status: "delivered" })]);
    const s = await notificationSignals(db, TZ, NOW);
    expect(s.unread).toBe(1);
    expect(s.muted).toBe(false);
  });
});

describe("gatherRuleContext", () => {
  it("flags a budget-exceeded finance signal", async () => {
    h.financeSignals.mockResolvedValue({
      overBudgetCategories: ["Dining"],
      largePaymentDueToday: null,
    });
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.finance?.budgetExceededCategory).toBe("Dining");
  });

  it("flags low hydration as water overdue", async () => {
    h.healthSignals.mockResolvedValue({ readiness: 80, hydrationPercent: 30, recovery: "high" });
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.health?.waterOverdue).toBe(true);
  });

  it("flags low readiness as recovery needed", async () => {
    h.healthSignals.mockResolvedValue({ readiness: 40, hydrationPercent: 80, recovery: "low" });
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.health?.recoveryNeeded).toBe(true);
  });

  it("flags a planner block starting within 10 min", async () => {
    h.listBlocks.mockResolvedValue([
      {
        id: "b1",
        title: "Deep work",
        type: "task",
        completed: false,
        startTime: new Date("2026-07-15T12:05:00Z"),
        endTime: new Date("2026-07-15T13:00:00Z"),
      },
    ]);
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.planner?.blockStartingTitle).toBe("Deep work");
    expect(ctx.planner?.blockStartingInMinutes).toBe(5);
  });

  it("does not flag a planner block far off", async () => {
    h.listBlocks.mockResolvedValue([
      {
        id: "b1",
        title: "Later",
        type: "task",
        completed: false,
        startTime: new Date("2026-07-15T15:00:00Z"),
        endTime: new Date("2026-07-15T16:00:00Z"),
      },
    ]);
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.planner).toBeUndefined();
  });

  it("flags a meeting starting within 10 min", async () => {
    h.calendarList.mockResolvedValue([
      {
        id: "e1",
        title: "Standup",
        startAt: "2026-07-15T12:08:00.000Z",
        endAt: "2026-07-15T12:30:00.000Z",
      },
    ]);
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.calendar?.meetingTitle).toBe("Standup");
  });

  it("flags focus break due from a take_break recommendation", async () => {
    h.focusRecommendations.mockResolvedValue([{ id: "break", action: "take_break" }]);
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.focus?.breakDue).toBe(true);
  });

  it("flags tomorrow not planned", async () => {
    h.tomorrowCounts.mockResolvedValue({
      ready: false,
      priorityCount: 0,
      checklistPercent: 0,
      status: "draft",
    });
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.tomorrow?.notPlanned).toBe(true);
  });

  it("passes inbox unread count through", async () => {
    h.inboxCountNew.mockResolvedValue(25);
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.inbox?.unreadCount).toBe(25);
  });

  it("degrades gracefully when a module throws", async () => {
    h.financeSignals.mockRejectedValue(new Error("boom"));
    const ctx = await gatherRuleContext(db, TZ, NOW);
    expect(ctx.finance).toBeUndefined();
    expect(ctx.now).toEqual(NOW);
  });
});
