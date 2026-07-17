import "server-only";
import {
  computeDeferUntil,
  decisionEngine,
  explainDecision,
  rankDecisions,
  type Decision,
  type DecisionContext,
  type DecisionExplanation,
  type DeferOption,
} from "@myos/core/decision";
import { planToday, selectWorkingHours, todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import * as todayRepo from "../today/repository";
import { getFocus, getMetrics, getState } from "../today/service";
import { countNew as countNewInbox } from "../inbox/service";
import { signals as projectSignals } from "../project/service";
import { healthSignals } from "../health/signals";
import { signals as financeSignals } from "../finance/summary";
import { signals as goalSignals } from "../goal/summary";
import { signals as analyticsSignals } from "../analytics/summary";
import { signals as tomorrowSignals } from "../tomorrow/service";
import { focusSignals } from "../focus/signals";
import { notificationSignals } from "../notification/signals";
import { automationSignals } from "../automation/signals";
import { orchestrationSignals } from "../orchestration/signals";
import { summary as orchestrationSummary } from "../orchestration/summary";
import { signals as knowledgeSignals } from "../knowledge/summary";
import { signals as lifeSignals } from "../life/signals";
import { signals as resourceSignals } from "../resource/summary";
import { signals as dashboardSignals } from "../intelligence/summary";
import * as repo from "./repository";
import { rowToDecision } from "./mapper";

/**
 * DecisionService (Sprint 2.3). Bridges the pure DecisionEngine with persistence.
 * `generate` reconciles the engine's decision set with decision_history; the
 * lifecycle mutations transition a single row.
 */
export interface DecisionPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

async function buildContext(
  db: Database,
  tz: string,
  prefs: DecisionPrefs,
  date: string,
): Promise<DecisionContext> {
  const [
    state,
    focus,
    metrics,
    inboxCount,
    project,
    health,
    finance,
    goal,
    analytics,
    tomorrow,
    focusMode,
    notifications,
    automation,
    orchestration,
    orchSummary,
    knowledge,
    life,
    resources,
    dashboard,
  ] = await Promise.all([
    getState(db, tz, date),
    getFocus(db, tz, date),
    getMetrics(db, tz, date),
    countNewInbox(db),
    projectSignals(db),
    healthSignals(db, date),
    financeSignals(db, tz),
    goalSignals(db),
    analyticsSignals(db, tz),
    tomorrowSignals(db, tz),
    focusSignals(db, tz),
    notificationSignals(db, tz),
    automationSignals(db, tz),
    orchestrationSignals(db, tz),
    orchestrationSummary(db, tz),
    knowledgeSignals(db),
    lifeSignals(db),
    resourceSignals(db),
    dashboardSignals(db, tz),
  ]);
  const workingHours = selectWorkingHours({
    state,
    preferredStartOfDay: prefs.preferredStartOfDay,
    preferredEndOfDay: prefs.preferredEndOfDay,
  });
  const now = new Date();
  return {
    now,
    timezone: tz,
    state,
    focus,
    metrics,
    workingHours,
    snapshot: planToday({ date, now, workingHours }),
    inboxCount,
    project: {
      topProjectName: project.topProjectName,
      criticalMilestones: project.criticalMilestones,
      atRiskCount: project.atRiskCount,
    },
    health: {
      readiness: health.readiness,
      lowSleep: health.lowSleep,
      highReadiness: health.highReadiness,
      recovery: health.recovery,
    },
    finance: {
      overBudgetCategories: finance.overBudgetCategories,
      largePaymentDueToday: finance.largePaymentDueToday,
      savingsNearlyComplete: finance.savingsNearlyComplete,
    },
    goal: {
      behindGoals: goal.behindGoals,
      habitsAtRisk: goal.habitsAtRisk,
      quarterEnding: goal.quarterEnding,
    },
    analytics: {
      plannerAccuracyFalling: analytics.plannerAccuracyFalling,
      goalVelocityDeclining: analytics.goalVelocityDeclining,
      productivityTrendFalling: analytics.productivityTrendFalling,
      meetingHeavy: analytics.meetingHeavy,
    },
    tomorrow: {
      tooMuchUnfinished: tomorrow.tooMuchUnfinished,
      heavyMeetingDay: tomorrow.heavyMeetingDay,
      lowReadiness: tomorrow.lowReadiness,
    },
    focusMode: {
      active: focusMode.active,
      tooManyInterruptions: focusMode.tooManyInterruptions,
      longUnfinished: focusMode.longUnfinished,
      plannerDrift: focusMode.plannerDrift,
    },
    notifications: {
      tooManyIgnored: notifications.tooManyIgnored,
      criticalOverdue: notifications.criticalOverdue,
      repeatedSnoozes: notifications.repeatedSnoozes,
    },
    automation: {
      failuresToday: automation.failuresToday > 0,
      runawayRule: automation.runawayRule,
      pendingApprovals: automation.pendingApprovals > 0,
    },
    orchestration: {
      failuresToday: orchestration.failuresToday > 0,
      recoveryRequired: orchSummary.recoveriesToday > 0,
      pipelinesPending: orchestration.pendingPipelines > 0,
    },
    knowledge: {
      flashcardsOverdue: knowledge.flashcardsOverdue > 0,
      bookStalled: knowledge.bookStalled,
      courseDeadline: knowledge.courseDeadlineSoon,
      researchInactive: knowledge.researchInactive,
      learningGoalFalling: knowledge.learningGoalFalling,
    },
    life: {
      habitStreakAtRisk: life.habitStreakAtRisk,
      routineSkipped: life.routineSkipped,
      lowRecovery: life.lowRecovery,
      doctorAppointment: life.doctorAppointmentSoon,
      medicationDue: life.medicationDue,
      trainingLoadHigh: life.trainingLoadHigh,
      identityGoalStalled: life.identityGoalStalled,
    },
    resources: {
      insuranceExpiring: resources.insuranceExpiring,
      documentExpiring: resources.documentExpiring,
      maintenanceOverdue: resources.maintenanceOverdue,
      relationshipCold: resources.relationshipCold,
      portfolioUnbalanced: resources.portfolioUnbalanced,
      largeExpenseDue: resources.largeExpenseDue,
      investmentReviewDue: resources.investmentReviewDue,
    },
    dashboard: {
      multipleAreasDeclining: dashboard.multipleAreasDeclining,
      overallHealthLow: dashboard.overallHealthLow,
      overallGrowthPositive: dashboard.overallGrowthPositive,
      reviewDue: dashboard.reviewDue,
      lifeBalanceLow: dashboard.lifeBalanceLow,
      attentionOverload: dashboard.attentionOverload,
    },
  };
}

/** Reconcile the engine's decisions into decision_history and return them ranked. */
export async function generate(
  db: Database,
  tz: string,
  prefs: DecisionPrefs,
): Promise<Decision[]> {
  const date = todayInTimeZone(tz);
  await todayRepo.ensureDay(db, date);

  const existing = (await repo.listByDate(db, date)).map(rowToDecision);
  const ctx = await buildContext(db, tz, prefs, date);
  const desired = decisionEngine.generate(ctx, existing);

  for (const decision of desired) {
    if (decision.id) await repo.updateDecision(db, decision.id, decision);
    else await repo.insertDecision(db, date, decision);
  }

  const rows = await repo.listByDate(db, date);
  return rankDecisions(rows.map(rowToDecision));
}

async function transition(
  db: Database,
  id: string,
  apply: (decision: Decision) => Decision,
): Promise<Decision> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Decision not found");
  const updated = apply(rowToDecision(row));
  return rowToDecision(await repo.updateDecision(db, id, updated));
}

export function accept(db: Database, id: string): Promise<Decision> {
  return transition(db, id, (d) => decisionEngine.accept(d, new Date()));
}

export function dismiss(db: Database, id: string): Promise<Decision> {
  return transition(db, id, (d) => decisionEngine.dismiss(d, new Date()));
}

export function complete(db: Database, id: string): Promise<Decision> {
  return transition(db, id, (d) => decisionEngine.complete(d, new Date()));
}

export function defer(
  db: Database,
  id: string,
  option: DeferOption,
  customUntil?: string,
): Promise<Decision> {
  const until = computeDeferUntil(option, new Date(), customUntil ? new Date(customUntil) : null);
  return transition(db, id, (d) => decisionEngine.defer(d, until));
}

export async function explain(
  db: Database,
  tz: string,
  prefs: DecisionPrefs,
  id: string,
): Promise<DecisionExplanation> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Decision not found");
  const ctx = await buildContext(db, tz, prefs, row.date);
  return explainDecision(rowToDecision(row), ctx);
}

export async function list(
  db: Database,
  date: string | undefined,
  limit: number,
): Promise<Decision[]> {
  const rows = await repo.list(db, date, limit);
  return rows.map(rowToDecision);
}
