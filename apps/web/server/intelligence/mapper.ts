import "server-only";
import type {
  Collection,
  DashboardPreferences,
  GeneratedReport,
  ReviewSnapshot,
} from "@myos/core/intelligence";
import type {
  DashboardPreferencesRow,
  ExecutiveReportRow,
  ReviewSnapshotRow,
  SavedCollectionRow,
} from "@myos/db/schema";
import type { DashboardWidget, ReportFormat, ReviewPeriod } from "@myos/core/intelligence";

/**
 * Intelligence mappers (Sprint 4.4). DB config/snapshot rows → pure core types. There are no
 * derived views to map — the dashboard recomputes those on read — only stored configuration
 * and immutable snapshots.
 */

export function preferencesRowTo(row: DashboardPreferencesRow): DashboardPreferences {
  return {
    widgetOrder: row.widgetOrder as DashboardWidget[],
    hiddenWidgets: row.hiddenWidgets as DashboardWidget[],
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function collectionRowTo(row: SavedCollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    entityRefs: row.entityRefs,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function reportRowTo(row: ExecutiveReportRow): GeneratedReport {
  return {
    format: row.format as ReportFormat,
    period: row.period as ReviewPeriod,
    title: row.title,
    content: row.content,
    generatedAt: row.generatedAt.toISOString(),
  };
}

export function snapshotRowTo(row: ReviewSnapshotRow): ReviewSnapshot {
  // The payload was stored verbatim from the immutable snapshot; return it as-is.
  return {
    period: row.period as ReviewPeriod,
    periodStart: row.periodStart,
    ...(row.payload as Omit<ReviewSnapshot, "period" | "periodStart">),
  };
}
