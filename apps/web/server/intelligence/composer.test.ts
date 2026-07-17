import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  analyticsDashboard: vi.fn(),
  knowledgeSummary: vi.fn(),
  lifeReadiness: vi.fn(),
  lifeSummary: vi.fn(),
  resourceSummary: vi.fn(),
  relationshipHealth: vi.fn(),
  financeAccounts: vi.fn(),
  goalList: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../analytics", () => ({ analyticsSummary: { dashboard: h.analyticsDashboard } }));
vi.mock("../knowledge", () => ({ knowledgeSummary: h.knowledgeSummary }));
vi.mock("../life", () => ({ lifeReadiness: h.lifeReadiness, lifeSummary: h.lifeSummary }));
vi.mock("../resource", () => ({
  resourceSummary: h.resourceSummary,
  resourceRelationshipHealth: h.relationshipHealth,
}));
vi.mock("../finance", () => ({ financeService: { accounts: h.financeAccounts } }));
vi.mock("../goal", () => ({ goalService: { list: h.goalList } }));

import { composeInput } from "./composer";
import { buildDashboard, computeSignals } from "@myos/core/intelligence";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.analyticsDashboard.mockResolvedValue({
    scores: {
      productivity: 75,
      focus: 70,
      planner: 80,
      health: 78,
      goals: 72,
      finance: 68,
      journal: 65,
      overall: 73,
    },
  });
  h.lifeReadiness.mockResolvedValue({ score: 78, recovery: 74 });
  h.knowledgeSummary.mockResolvedValue({
    totalNotes: 80,
    dueFlashcards: 5,
    activeBook: "Deep Work",
    activeResearch: null,
    reviewsToday: 0,
  });
  h.resourceSummary.mockResolvedValue({
    netWorth: 500_000,
    upcomingRenewals: 2,
    documentsExpiring: 1,
    followUpsDue: 0,
    investmentValue: 0,
    investmentGain: 0,
    upcomingBirthdays: 0,
    maintenanceOverdue: 0,
    nextBirthday: null,
  });
  h.financeAccounts.mockResolvedValue([
    { type: "checking", balance: 60_000 },
    { type: "savings", balance: 40_000 },
    { type: "investment", balance: 999_999 },
  ]);
  h.goalList.mockResolvedValue([
    {
      id: "g1",
      status: "active",
      title: "A",
      targetDate: null,
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "g2",
      status: "paused",
      title: "B",
      targetDate: null,
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
  ]);
  h.relationshipHealth.mockResolvedValue([
    { relationshipId: "r1", strength: "strong", followUpDue: false },
    { relationshipId: "r2", strength: "dormant", followUpDue: true },
  ]);
  h.lifeSummary.mockResolvedValue({ readiness: 82, bestStreak: 21, workoutsThisWeek: 3 });
});

describe("composer — reads owned numbers, computes none", () => {
  it("forwards the Analytics ScoreBoard verbatim", async () => {
    const input = await composeInput(db, "UTC");
    expect(input.analytics.productivity).toBe(75);
    expect(input.analytics.overall).toBe(73);
  });

  it("sums only liquid finance accounts into cash — excludes investment", async () => {
    const input = await composeInput(db, "UTC");
    expect(input.finance.cashBalance).toBe(100_000);
  });

  it("counts goal status into on-track vs slipping", async () => {
    const input = await composeInput(db, "UTC");
    expect(input.goals.slipping).toBe(1);
    expect(input.goals.total).toBe(2);
  });

  it("reads relationship strength from the CRM health report", async () => {
    const input = await composeInput(db, "UTC");
    expect(input.resources.relationshipsStrong).toBe(1);
    expect(input.resources.relationshipsDormant).toBe(1);
    expect(input.resources.followUpsDue).toBe(1);
  });

  it("previous values are null so trends read flat on a fresh install", async () => {
    const input = await composeInput(db, "UTC");
    expect(input.analytics.previous).toBeNull();
    expect(input.health.previousReadiness).toBeNull();
  });

  it("the composed input drives a real dashboard", async () => {
    const input = await composeInput(db, "UTC");
    const dash = buildDashboard(input);
    expect(dash.balance.areas).toHaveLength(8);
    expect(dash.summary.overall).toBeGreaterThan(0);
    // renewals + expiring documents surface in attention.
    expect(dash.attention.some((a) => a.id === "renewals-due")).toBe(true);
    expect(computeSignals(input)).toBeDefined();
  });
});
