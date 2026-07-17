import "server-only";
import { buildForecast, type ResourceForecast } from "@myos/core/resource";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Resource forecasting (Sprint 4.3). Walks the known, dated obligations inside a horizon:
 * insurance premiums on their cadence, scheduled maintenance, vehicle renewals and travel
 * expiries. Deterministic — there is no model and no ML, and costs the user has not
 * recorded are forecast at zero rather than invented.
 */

export async function forecast(
  db: Database,
  horizonDays?: number,
  now = new Date(),
): Promise<ResourceForecast> {
  const [policies, maintenance, vehicles, travel] = await Promise.all([
    repo.listPolicies(db),
    repo.listMaintenance(db),
    repo.listVehicles(db),
    repo.listTravelDocuments(db),
  ]);
  return buildForecast({ policies, maintenance, vehicles, travel }, now, horizonDays);
}
