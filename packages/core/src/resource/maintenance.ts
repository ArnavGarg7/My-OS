import type { MaintenanceStatus } from "./constants";
import { addDays, daysBetween, parseDate, round2, ymd } from "./dates";
import type { Asset, AssetMaintenance, MaintenanceView } from "./types";

/**
 * Maintenance engine (Sprint 4.3). A deterministic schedule over asset/vehicle upkeep:
 * status is derived by comparing `dueAt` to `now`, never stored, and recurrence advances by
 * a fixed interval. This module decides what is due — the Planner turns that into blocks
 * and Tasks turns it into work; neither ownership leaks in here.
 */

/** Status is a pure function of the row and the clock. */
export function statusOf(item: AssetMaintenance, now: Date): MaintenanceStatus {
  if (item.completedAt) return "completed";
  return daysBetween(now, parseDate(item.dueAt)) < 0 ? "overdue" : "scheduled";
}

export function viewOf(item: AssetMaintenance, assets: Asset[], now: Date): MaintenanceView {
  const asset = assets.find((a) => a.id === item.assetId);
  return {
    id: item.id,
    assetId: item.assetId,
    assetName: asset?.name ?? "Unknown asset",
    title: item.title,
    dueAt: item.dueAt,
    status: statusOf(item, now),
    daysUntilDue: daysBetween(now, parseDate(item.dueAt)),
    cost: item.cost,
  };
}

/** Every maintenance item as a derived view, soonest-due first. */
export function schedule(items: AssetMaintenance[], assets: Asset[], now: Date): MaintenanceView[] {
  return items.map((i) => viewOf(i, assets, now)).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export function overdue(items: AssetMaintenance[], assets: Asset[], now: Date): MaintenanceView[] {
  return schedule(items, assets, now).filter((v) => v.status === "overdue");
}

export function dueWithin(
  items: AssetMaintenance[],
  assets: Asset[],
  now: Date,
  days: number,
): MaintenanceView[] {
  return schedule(items, assets, now).filter(
    (v) => v.status !== "completed" && v.daysUntilDue >= 0 && v.daysUntilDue <= days,
  );
}

/**
 * The next occurrence after completing a recurring item. One-off items (intervalDays 0)
 * return null — completion simply ends them.
 */
export function nextDueDate(item: AssetMaintenance, completedAt: Date): string | null {
  if (item.intervalDays <= 0) return null;
  return ymd(addDays(completedAt, item.intervalDays));
}

/** Total spend on completed maintenance — the "what did upkeep cost me" number. */
export function maintenanceSpend(items: AssetMaintenance[]): number {
  return round2(items.filter((i) => i.completedAt).reduce((sum, i) => sum + i.cost, 0));
}

export function completedCount(items: AssetMaintenance[]): number {
  return items.filter((i) => i.completedAt).length;
}
