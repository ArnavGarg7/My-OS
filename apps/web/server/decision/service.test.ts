import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionHistoryRow } from "@myos/db/schema";
import type { Decision } from "@myos/core/decision";

// DecisionService is server-only; mock the DB boundary (its own repository + the
// reused today repository/service) and verify reconciliation + lifecycle wiring.
const h = vi.hoisted(() => ({
  listByDate: vi.fn(),
  list: vi.fn(),
  getById: vi.fn(),
  insertDecision: vi.fn(),
  updateDecision: vi.fn(),
  ensureDay: vi.fn(),
  getState: vi.fn(),
  getFocus: vi.fn(),
  getMetrics: vi.fn(),
  countNewInbox: vi.fn(),
  projectSignals: vi.fn(),
  healthSignals: vi.fn(),
  financeSignals: vi.fn(),
  goalSignals: vi.fn(),
  analyticsSignals: vi.fn(),
  tomorrowSignals: vi.fn(),
  focusSignals: vi.fn(),
  notificationSignals: vi.fn(),
  automationSignals: vi.fn(),
  orchestrationSignals: vi.fn(),
  orchestrationSummary: vi.fn(),
  knowledgeSignals: vi.fn(),
  lifeSignals: vi.fn(),
  resourceSignals: vi.fn(),
  dashboardSignals: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../project/service", () => ({ signals: h.projectSignals }));
vi.mock("../health/signals", () => ({ healthSignals: h.healthSignals }));
vi.mock("../finance/summary", () => ({ signals: h.financeSignals }));
vi.mock("../goal/summary", () => ({ signals: h.goalSignals }));
vi.mock("../analytics/summary", () => ({ signals: h.analyticsSignals }));
vi.mock("../tomorrow/service", () => ({ signals: h.tomorrowSignals }));
vi.mock("../focus/signals", () => ({ focusSignals: h.focusSignals }));
vi.mock("../notification/signals", () => ({ notificationSignals: h.notificationSignals }));
vi.mock("../automation/signals", () => ({ automationSignals: h.automationSignals }));
vi.mock("../orchestration/signals", () => ({ orchestrationSignals: h.orchestrationSignals }));
vi.mock("../orchestration/summary", () => ({ summary: h.orchestrationSummary }));
vi.mock("../knowledge/summary", () => ({ signals: h.knowledgeSignals }));
vi.mock("../life/signals", () => ({ signals: h.lifeSignals }));
vi.mock("../resource/summary", () => ({ signals: h.resourceSignals }));
vi.mock("../intelligence/summary", () => ({ signals: h.dashboardSignals }));
vi.mock("./repository", () => ({
  listByDate: h.listByDate,
  list: h.list,
  getById: h.getById,
  insertDecision: h.insertDecision,
  updateDecision: h.updateDecision,
}));
vi.mock("../today/repository", () => ({ ensureDay: h.ensureDay }));
vi.mock("../today/service", () => ({
  getState: h.getState,
  getFocus: h.getFocus,
  getMetrics: h.getMetrics,
}));
vi.mock("../inbox/service", () => ({ countNew: h.countNewInbox }));

import * as service from "./service";
import { decisionToColumns, rowToDecision } from "./mapper";

const db = {} as never;
const TZ = "Asia/Kolkata";
const PREFS = { preferredStartOfDay: "09:00", preferredEndOfDay: "18:00" };

function decisionRow(over: Partial<DecisionHistoryRow> = {}): DecisionHistoryRow {
  return {
    id: "d1",
    date: "2026-07-06",
    decision: "Continue: Ship the release",
    reason: "Working hours have begun",
    confidence: 80,
    accepted: false,
    dismissed: false,
    status: "pending",
    priority: "high",
    score: 74,
    ruleId: "continue-mission",
    expiresAt: null,
    deferredUntil: null,
    completedAt: null,
    metadata: { type: "focus", inputsUsed: ["mission", "workingHours"] },
    timestamp: new Date("2026-07-06T04:00:00Z"),
    createdAt: new Date("2026-07-06T04:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.countNewInbox.mockResolvedValue(0);
  h.projectSignals.mockResolvedValue({
    topProjectName: null,
    criticalMilestones: [],
    atRiskCount: 0,
  });
  h.healthSignals.mockResolvedValue({
    readiness: 60,
    recovery: "recovering",
    sleepMinutes: 450,
    energy: "medium",
    hydrationPercent: 50,
    lowSleep: false,
    highReadiness: false,
    nextWorkoutType: null,
  });
  h.financeSignals.mockResolvedValue({
    overBudgetCategories: [],
    largePaymentDueToday: null,
    savingsNearlyComplete: null,
  });
  h.goalSignals.mockResolvedValue({
    activeCount: 0,
    overallProgress: 0,
    behindGoals: [],
    habitsAtRisk: [],
    bestHabitStreak: 0,
    quarterEnding: false,
  });
  h.analyticsSignals.mockResolvedValue({
    plannerAccuracyFalling: false,
    goalVelocityDeclining: false,
    productivityTrendFalling: false,
    meetingHeavy: false,
  });
  h.tomorrowSignals.mockResolvedValue({
    tooMuchUnfinished: false,
    heavyMeetingDay: false,
    lowReadiness: false,
    carryForwardCount: 0,
    priorityCount: 0,
  });
  h.focusSignals.mockResolvedValue({
    active: false,
    status: "idle",
    tooManyInterruptions: false,
    longUnfinished: false,
    plannerDrift: false,
    focusMinutesToday: 0,
  });
  h.notificationSignals.mockResolvedValue({
    unread: 0,
    queued: 0,
    criticalOverdue: false,
    tooManyIgnored: false,
    repeatedSnoozes: false,
    muted: false,
    inQuietHours: false,
  });
  h.automationSignals.mockResolvedValue({
    enabledRules: 0,
    failuresToday: 0,
    pendingApprovals: 0,
    runawayRule: false,
  });
  h.orchestrationSignals.mockResolvedValue({
    healthy: true,
    running: false,
    recovering: false,
    failuresToday: 0,
    pendingPipelines: 0,
  });
  h.orchestrationSummary.mockResolvedValue({
    status: "completed",
    lastRunAt: null,
    runsToday: 0,
    failuresToday: 0,
    recoveriesToday: 0,
    affectedModulesLastRun: 0,
    systemReady: true,
  });
  h.knowledgeSignals.mockResolvedValue({
    flashcardsOverdue: 0,
    bookStalled: false,
    courseDeadlineSoon: false,
    researchInactive: false,
    learningGoalFalling: false,
  });
  h.lifeSignals.mockResolvedValue({
    habitStreakAtRisk: false,
    routineSkipped: false,
    lowRecovery: false,
    doctorAppointmentSoon: false,
    medicationDue: false,
    trainingLoadHigh: false,
    identityGoalStalled: false,
  });
  h.resourceSignals.mockResolvedValue({
    insuranceExpiring: false,
    documentExpiring: false,
    maintenanceOverdue: false,
    relationshipCold: false,
    portfolioUnbalanced: false,
    largeExpenseDue: false,
    investmentReviewDue: false,
  });
  h.dashboardSignals.mockResolvedValue({
    multipleAreasDeclining: false,
    overallHealthLow: false,
    overallGrowthPositive: false,
    reviewDue: false,
    lifeBalanceLow: false,
    attentionOverload: false,
  });
  h.getState.mockResolvedValue({
    date: "2026-07-06",
    wakeTime: null,
    sleepTarget: null,
    energyLevel: "high",
    focusScore: null,
    currentBlock: null,
    currentActivity: "Ship the release",
    status: "active",
    morningCompleted: false,
    morningCompletedAt: null,
    eveningCompleted: false,
    lastRecalculatedAt: null,
  });
  h.getFocus.mockResolvedValue({
    date: "2026-07-06",
    mission: "Ship the release",
    priority: "high",
    blocks: [],
    interruptions: 0,
    focusSwitches: 0,
  });
  h.getMetrics.mockResolvedValue({
    date: "2026-07-06",
    completedTasks: 0,
    deepWorkMinutes: 0,
    meetings: 0,
    interruptions: 0,
    focusSwitches: 0,
    plannerAccuracy: null,
    energyEntries: [],
  });
});

describe("mapper", () => {
  it("maps a row to a Decision DTO (type + inputs from metadata)", () => {
    const d = rowToDecision(decisionRow());
    expect(d.type).toBe("focus");
    expect(d.inputsUsed).toEqual(["mission", "workingHours"]);
    expect(d.state).toBe("pending");
    expect(d.title).toBe("Continue: Ship the release");
    expect(d.createdAt).toBe("2026-07-06T04:00:00.000Z");
  });

  it("defaults type to system and inputs to [] when metadata is empty", () => {
    const d = rowToDecision(
      decisionRow({ metadata: {}, ruleId: null, reason: null, confidence: null }),
    );
    expect(d.type).toBe("system");
    expect(d.inputsUsed).toEqual([]);
    expect(d.ruleId).toBe("");
    expect(d.reason).toBe("");
    expect(d.confidence).toBe(0);
  });

  it("packs state into the accepted/dismissed booleans and metadata", () => {
    const decision: Decision = { ...rowToDecision(decisionRow()), state: "accepted" };
    const cols = decisionToColumns(decision);
    expect(cols.status).toBe("accepted");
    expect(cols.accepted).toBe(true);
    expect(cols.dismissed).toBe(false);
    expect(cols.metadata).toMatchObject({ type: "focus" });
  });

  it("round-trips timestamps through the columns", () => {
    const decision = rowToDecision(decisionRow({ expiresAt: new Date("2026-07-06T06:00:00Z") }));
    const cols = decisionToColumns(decision);
    expect(cols.expiresAt?.toISOString()).toBe("2026-07-06T06:00:00.000Z");
  });
});

describe("generate", () => {
  it("inserts engine-produced decisions that have no id yet", async () => {
    h.listByDate.mockResolvedValueOnce([]).mockResolvedValueOnce([decisionRow()]);
    h.insertDecision.mockResolvedValue(decisionRow());

    const result = await service.generate(db, TZ, PREFS);

    expect(h.ensureDay).toHaveBeenCalled();
    expect(h.insertDecision).toHaveBeenCalled();
    expect(h.updateDecision).not.toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });

  it("updates a matched existing decision in place rather than inserting a duplicate", async () => {
    h.listByDate.mockResolvedValue([decisionRow()]);
    h.updateDecision.mockResolvedValue(decisionRow());
    h.insertDecision.mockResolvedValue(decisionRow());

    await service.generate(db, TZ, PREFS);

    // The existing continue-mission row is carried forward by id (update, not insert).
    expect(h.updateDecision).toHaveBeenCalledWith(db, "d1", expect.any(Object));
    // No second continue-mission row is inserted for the same rule.
    const insertedRuleIds = h.insertDecision.mock.calls.map((c) => (c[2] as Decision).ruleId);
    expect(insertedRuleIds).not.toContain("continue-mission");
  });

  it("returns decisions ranked (critical/high first)", async () => {
    const critical = decisionRow({ id: "c1", priority: "critical", score: 40 });
    const low = decisionRow({ id: "l1", priority: "low", score: 90 });
    h.listByDate.mockResolvedValue([low, critical]);
    h.updateDecision.mockImplementation((_db, id) => Promise.resolve(id === "c1" ? critical : low));

    const result = await service.generate(db, TZ, PREFS);
    expect(result[0]?.priority).toBe("critical");
  });
});

describe("lifecycle transitions", () => {
  it("accept flips state to accepted", async () => {
    h.getById.mockResolvedValue(decisionRow());
    h.updateDecision.mockImplementation((_db, _id, d: Decision) =>
      Promise.resolve(decisionRow({ status: d.state })),
    );

    const result = await service.accept(db, "d1");
    expect(result.state).toBe("accepted");
    expect(h.updateDecision).toHaveBeenCalledWith(
      db,
      "d1",
      expect.objectContaining({ state: "accepted" }),
    );
  });

  it("dismiss sets a cooldown and does not resurface immediately", async () => {
    h.getById.mockResolvedValue(decisionRow());
    let captured: Decision | undefined;
    h.updateDecision.mockImplementation((_db, _id, d: Decision) => {
      captured = d;
      return Promise.resolve(decisionRow({ status: d.state, metadata: d.metadata }));
    });

    const result = await service.dismiss(db, "d1");
    expect(result.state).toBe("dismissed");
    expect(captured?.metadata?.["cooldownUntil"]).toBeDefined();
  });

  it("complete marks the decision completed with a completedAt", async () => {
    h.getById.mockResolvedValue(decisionRow({ status: "accepted", accepted: true }));
    h.updateDecision.mockImplementation((_db, _id, d: Decision) =>
      Promise.resolve(
        decisionRow({
          status: d.state,
          completedAt: d.completedAt ? new Date(d.completedAt) : null,
        }),
      ),
    );

    const result = await service.complete(db, "d1");
    expect(result.state).toBe("completed");
    expect(result.completedAt).not.toBeNull();
  });

  it("defer schedules deferredUntil into the future", async () => {
    h.getById.mockResolvedValue(decisionRow());
    let captured: Decision | undefined;
    h.updateDecision.mockImplementation((_db, _id, d: Decision) => {
      captured = d;
      return Promise.resolve(
        decisionRow({
          status: d.state,
          deferredUntil: d.deferredUntil ? new Date(d.deferredUntil) : null,
        }),
      );
    });

    const result = await service.defer(db, "d1", "1h");
    expect(result.state).toBe("deferred");
    expect(captured?.deferredUntil).toBeTruthy();
    expect(new Date(captured!.deferredUntil!).getTime()).toBeGreaterThan(Date.now());
  });

  it("throws when transitioning a missing decision", async () => {
    h.getById.mockResolvedValue(undefined);
    await expect(service.accept(db, "missing")).rejects.toThrow("Decision not found");
  });
});

describe("explain", () => {
  it("returns a deterministic explanation for the row", async () => {
    h.getById.mockResolvedValue(decisionRow());
    const explanation = await service.explain(db, TZ, PREFS, "d1");
    expect(explanation.ruleId).toBe("continue-mission");
    expect(explanation.reason).toBeTruthy();
    expect(explanation.breakdown.length).toBeGreaterThan(0);
  });

  it("throws when explaining a missing decision", async () => {
    h.getById.mockResolvedValue(undefined);
    await expect(service.explain(db, TZ, PREFS, "missing")).rejects.toThrow("Decision not found");
  });
});

describe("list", () => {
  it("maps rows and forwards the date + limit to the repository", async () => {
    h.list.mockResolvedValue([decisionRow()]);
    const result = await service.list(db, "2026-07-06", 25);
    expect(result[0]?.title).toBe("Continue: Ship the release");
    expect(h.list).toHaveBeenCalledWith(db, "2026-07-06", 25);
  });
});
