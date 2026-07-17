import type { MilestoneStatus } from "./constants";
import type { MilestoneView } from "./types";

/**
 * Milestones (Sprint 4.4). Rolls milestones up from every owning module (Goals, Projects,
 * Knowledge, Health, Finance, Resources) into one dated list. The owning module supplies the
 * title, source and date; this module only derives the status from that date versus `now`.
 * Nothing is stored — the same milestone is re-dated on every read.
 */

/** What each owning module hands the dashboard. Dates only; no derived status. */
export interface MilestoneInput {
  id: string;
  title: string;
  source: string;
  /** ISO date. Completed milestones carry `completedAt`; open ones carry a due `date`. */
  date: string;
  completedAt: string | null;
}

function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

export function statusOf(m: MilestoneInput, now: Date): MilestoneStatus {
  if (m.completedAt) return "completed";
  return daysBetween(now, new Date(m.date)) < 0 ? "overdue" : "upcoming";
}

export function milestoneView(m: MilestoneInput, now: Date): MilestoneView {
  return {
    id: m.id,
    title: m.title,
    source: m.source,
    status: statusOf(m, now),
    date: m.date.slice(0, 10),
    daysUntil: daysBetween(now, new Date(m.date)),
  };
}

/** Every milestone as a derived view, soonest-due first (completed sink to the bottom). */
export function milestones(input: MilestoneInput[], now: Date): MilestoneView[] {
  return input
    .map((m) => milestoneView(m, now))
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (b.status === "completed" && a.status !== "completed") return -1;
      return a.daysUntil - b.daysUntil;
    });
}

export function upcomingMilestones(views: MilestoneView[]): MilestoneView[] {
  return views.filter((m) => m.status === "upcoming");
}

export function overdueMilestones(views: MilestoneView[]): MilestoneView[] {
  return views.filter((m) => m.status === "overdue");
}

export function completedMilestones(views: MilestoneView[]): MilestoneView[] {
  return views.filter((m) => m.status === "completed");
}
