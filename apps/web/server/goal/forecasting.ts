import "server-only";
import { goalEngine, type GoalForecast } from "@myos/core/goal";
import type { Database } from "@myos/db";
import { get } from "./service";

/**
 * Goal forecast composition (Sprint 2.12). Runs the pure rule-based forecast
 * over a hydrated goal. No ML.
 */
export async function forecastGoal(db: Database, id: string): Promise<GoalForecast> {
  return goalEngine.forecast(await get(db, id), new Date());
}
