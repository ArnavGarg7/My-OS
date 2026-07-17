import "server-only";
import {
  scorecards,
  trends as buildTrends,
  wheelOfLife,
  lifeBalance,
  type Scorecard,
  type TrendView,
  type WheelSlice,
} from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { composeInput } from "./composer";

/**
 * Server trend + scorecard + wheel views (Sprint 4.4). Thin wrappers over the pure core, so
 * the heavy Wheel/Trends visualizations can be fetched (and lazy-loaded) independently of
 * the main dashboard payload.
 */
export async function trends(db: Database, tz: string): Promise<TrendView[]> {
  return buildTrends(await composeInput(db, tz));
}

export async function scorecardViews(db: Database, tz: string): Promise<Scorecard[]> {
  return scorecards(await composeInput(db, tz));
}

export async function wheel(db: Database, tz: string): Promise<WheelSlice[]> {
  return wheelOfLife(lifeBalance(await composeInput(db, tz)).areas);
}
