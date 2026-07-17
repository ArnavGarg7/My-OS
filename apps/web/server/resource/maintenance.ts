import "server-only";
import {
  dueWithin,
  overdue,
  schedule,
  vehicleRenewals,
  type MaintenanceView,
  type RenewalItem,
} from "@myos/core/resource";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Server maintenance views (Sprint 4.3). Status is derived by the pure core from `dueAt`
 * versus the clock, so an item can never sit in the database claiming to be "scheduled" a
 * year after it went overdue. This module decides what is due; the Planner turns that into
 * blocks and Tasks into work — neither ownership leaks in here.
 */

export async function maintenanceSchedule(
  db: Database,
  now = new Date(),
): Promise<MaintenanceView[]> {
  const [items, assets] = await Promise.all([repo.listMaintenance(db), repo.listAssets(db)]);
  return schedule(items, assets, now);
}

export async function overdueMaintenance(
  db: Database,
  now = new Date(),
): Promise<MaintenanceView[]> {
  const [items, assets] = await Promise.all([repo.listMaintenance(db), repo.listAssets(db)]);
  return overdue(items, assets, now);
}

/** Upcoming work inside a window — the Planner/Tomorrow feed. */
export async function upcomingMaintenance(
  db: Database,
  days = 30,
  now = new Date(),
): Promise<MaintenanceView[]> {
  const [items, assets] = await Promise.all([repo.listMaintenance(db), repo.listAssets(db)]);
  return dueWithin(items, assets, now, days);
}

export async function vehicleRenewalItems(db: Database, now = new Date()): Promise<RenewalItem[]> {
  return vehicleRenewals(await repo.listVehicles(db), now);
}
