import { RENEWAL_SOON_DAYS } from "./constants";
import { daysBetween, parseDate } from "./dates";
import type { AssetMaintenance, RenewalItem, Vehicle } from "./types";
import { schedule } from "./maintenance";
import type { Asset, MaintenanceView } from "./types";

/**
 * Vehicle engine (Sprint 4.3). Registration, pollution certificate and the service history
 * that hangs off the shared maintenance engine — fuel, service, tires, battery, repairs are
 * all maintenance rows against the vehicle's asset, so there is exactly one scheduler in
 * this platform rather than two that drift apart.
 */

/** Registration + pollution expiries as unified renewal items. */
export function vehicleRenewals(
  vehicles: Vehicle[],
  now: Date,
  days = RENEWAL_SOON_DAYS,
): RenewalItem[] {
  const out: RenewalItem[] = [];
  for (const v of vehicles) {
    if (v.registrationExpiresAt) {
      const d = daysBetween(now, parseDate(v.registrationExpiresAt));
      if (d <= days) {
        out.push({
          id: `${v.id}:registration`,
          name: `${v.name} registration`,
          source: "vehicle",
          expiresAt: v.registrationExpiresAt,
          daysUntil: d,
          expired: d < 0,
        });
      }
    }
    if (v.pollutionExpiresAt) {
      const d = daysBetween(now, parseDate(v.pollutionExpiresAt));
      if (d <= days) {
        out.push({
          id: `${v.id}:pollution`,
          name: `${v.name} pollution certificate`,
          source: "vehicle",
          expiresAt: v.pollutionExpiresAt,
          daysUntil: d,
          expired: d < 0,
        });
      }
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Maintenance rows belonging to a vehicle, via its linked asset. */
export function vehicleMaintenance(
  vehicle: Vehicle,
  items: AssetMaintenance[],
  assets: Asset[],
  now: Date,
): MaintenanceView[] {
  if (!vehicle.assetId) return [];
  return schedule(
    items.filter((i) => i.assetId === vehicle.assetId),
    assets,
    now,
  );
}

/** Total spend logged against a vehicle's maintenance history. */
export function vehicleSpend(vehicle: Vehicle, items: AssetMaintenance[]): number {
  if (!vehicle.assetId) return 0;
  return items
    .filter((i) => i.assetId === vehicle.assetId && i.completedAt)
    .reduce((sum, i) => sum + i.cost, 0);
}

export function uninsured(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter((v) => v.insurancePolicyId === null);
}
