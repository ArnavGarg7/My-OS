import "server-only";
import type { Review, ScoreBoard } from "@myos/core/analytics";
import type { AnalyticsReportRow, AnalyticsSnapshotRow, WeeklyReviewRow } from "@myos/db/schema";

/**
 * Analytics row ↔ DTO mapping (Sprint 2.14). Reviews/reports are serialised into
 * jsonb metadata; snapshots persist the scoreboard columns for fast reads.
 */
export interface AnalyticsReportDTO {
  id: string;
  reportType: AnalyticsReportRow["reportType"];
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  metadata: Record<string, unknown>;
}

export function reportRowToDTO(row: AnalyticsReportRow): AnalyticsReportDTO {
  return {
    id: row.id,
    reportType: row.reportType,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    generatedAt: row.generatedAt.toISOString(),
    metadata: row.metadata,
  };
}

export function snapshotColumns(
  date: string,
  scores: ScoreBoard,
): Omit<AnalyticsSnapshotRow, "id" | "createdAt"> {
  return {
    snapshotDate: date,
    productivityScore: scores.productivity,
    focusScore: scores.focus,
    plannerAccuracy: scores.planner,
    healthScore: scores.health,
    goalProgress: scores.goals,
    financeScore: scores.finance,
    journalScore: scores.journal,
    overallScore: scores.overall,
  };
}

export interface WeeklyReviewDTO {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export function weeklyReviewRowToDTO(row: WeeklyReviewRow): WeeklyReviewDTO {
  return {
    id: row.id,
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

/** A short deterministic headline for a persisted review. */
export function reviewSummaryLine(review: Review): string {
  return (
    `Overall ${review.scores.overall} · ${review.productivity.tasksCompleted} tasks · ` +
    `${review.focus.deepWorkMinutes}m deep work` +
    (review.achievements[0] ? ` · ${review.achievements[0]}` : "")
  );
}
