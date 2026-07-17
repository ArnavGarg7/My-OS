import "server-only";
import {
  buildSummary,
  computeSignals,
  type ResourceSignals,
  type ResourceSummary,
  type SignalInput,
} from "@myos/core/resource";
import type { Database } from "@myos/db";
import { gather } from "./portfolio";
import * as repo from "./repository";

/**
 * Resource summary + signals (Sprint 4.3). The two read models the rest of My OS consumes:
 * `summary()` feeds Morning, Tomorrow and the status bar; `signals()` feeds the Decision
 * engine. Both defer entirely to the pure core — every threshold lives in core/constants,
 * so no rule and no component can drift from the number that produced it.
 *
 * These are also the AI seams: Phase 5 reads summary()/signals()/portfolio()/search()
 * rather than reaching into the tables.
 */

/** Everything the signal + summary selectors need, loaded once. */
export async function gatherSignalInput(db: Database): Promise<SignalInput> {
  const [base, maintenance, reviews] = await Promise.all([
    gather(db),
    repo.listMaintenance(db),
    repo.listReviews(db),
  ]);
  return { ...base, maintenance, reviews };
}

export async function summary(db: Database, now = new Date()): Promise<ResourceSummary> {
  return buildSummary(await gatherSignalInput(db), now);
}

export async function signals(db: Database, now = new Date()): Promise<ResourceSignals> {
  return computeSignals(await gatherSignalInput(db), now);
}
