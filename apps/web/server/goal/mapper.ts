import "server-only";
import type {
  Goal,
  GoalLink,
  GoalLinkTarget,
  GoalPriority,
  GoalReview,
  GoalStatus,
  GoalType,
  Habit,
  HabitFrequency,
  KeyResult,
  KeyResultStatus,
  MetricType,
  Objective,
  ObjectiveStatus,
  ReviewPeriod,
} from "@myos/core/goal";
import type {
  GoalLinkRow,
  GoalObjectiveRow,
  GoalReviewRow,
  GoalRow,
  HabitRow,
  KeyResultRow,
} from "@myos/db/schema";

/**
 * Goal row ↔ DTO mapping (Sprint 2.12). Timestamps become ISO strings for the
 * pure engine + client. Objectives/key-results/habits/links are hydrated in.
 */
export function goalRowToGoal(
  row: GoalRow,
  objectives: Objective[] = [],
  habits: Habit[] = [],
  links: GoalLink[] = [],
): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    goalType: row.goalType as GoalType,
    status: row.status as GoalStatus,
    priority: row.priority as GoalPriority,
    targetDate: row.targetDate,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    objectives,
    habits,
    links,
  };
}

export function objectiveRowToObjective(
  row: GoalObjectiveRow,
  keyResults: KeyResult[] = [],
): Objective {
  return {
    id: row.id,
    goalId: row.goalId,
    title: row.title,
    description: row.description,
    weight: row.weight,
    status: row.status as ObjectiveStatus,
    keyResults,
  };
}

export function keyResultRowToKeyResult(row: KeyResultRow): KeyResult {
  return {
    id: row.id,
    objectiveId: row.objectiveId,
    title: row.title,
    metricType: row.metricType as MetricType,
    currentValue: row.currentValue,
    targetValue: row.targetValue,
    unit: row.unit,
    status: row.status as KeyResultStatus,
  };
}

export function habitRowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    goalId: row.goalId,
    title: row.title,
    frequency: row.frequency as HabitFrequency,
    target: row.target,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastCompleted: row.lastCompleted,
    active: row.active,
    history: row.history,
  };
}

export function reviewRowToReview(row: GoalReviewRow): GoalReview {
  return {
    id: row.id,
    goalId: row.goalId,
    reviewPeriod: row.reviewPeriod as ReviewPeriod,
    summary: row.summary,
    progressSnapshot: row.progressSnapshot,
    reviewedAt: row.reviewedAt.toISOString(),
  };
}

export function linkRowToLinks(row: GoalLinkRow): GoalLink[] {
  const links: GoalLink[] = [];
  if (row.projectId) links.push({ target: "project", targetId: row.projectId });
  if (row.taskId) links.push({ target: "task", targetId: row.taskId });
  if (row.journalEntryId) links.push({ target: "journal_entry", targetId: row.journalEntryId });
  if (row.financeGoalId) links.push({ target: "finance_goal", targetId: row.financeGoalId });
  if (row.healthMetric) links.push({ target: "health_metric", targetId: row.healthMetric });
  return links;
}

export function linkToColumns(target: GoalLinkTarget, targetId: string) {
  return {
    projectId: target === "project" ? targetId : null,
    taskId: target === "task" ? targetId : null,
    journalEntryId: target === "journal_entry" ? targetId : null,
    financeGoalId: target === "finance_goal" ? targetId : null,
    healthMetric: target === "health_metric" ? targetId : null,
  };
}
