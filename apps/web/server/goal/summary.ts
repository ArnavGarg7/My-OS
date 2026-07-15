import "server-only";
import {
  goalEngine,
  searchGoals,
  type GoalPortfolio,
  type GoalSignals,
  type GoalSummaryItem,
} from "@myos/core/goal";
import type { Database } from "@myos/db";
import { get, list } from "./service";

/**
 * Goal summary + portfolio + signals + search (Sprint 2.12). Composes the pure
 * engine over hydrated goals. Everything is derived at read time.
 */
export async function portfolio(db: Database): Promise<GoalPortfolio> {
  return goalEngine.portfolio(await list(db), new Date());
}

export async function signals(db: Database): Promise<GoalSignals> {
  return goalEngine.signals(await list(db), new Date());
}

export async function summary(db: Database, id: string): Promise<GoalSummaryItem> {
  return goalEngine.summary(await get(db, id), new Date());
}

export async function forecast(db: Database, id: string) {
  return goalEngine.forecast(await get(db, id), new Date());
}

export async function progress(db: Database, id: string) {
  return goalEngine.progress(await get(db, id));
}

export async function search(db: Database, query: string) {
  return searchGoals(await list(db), query);
}

export async function counts(
  db: Database,
): Promise<{ goals: number; active: number; habits: number }> {
  const goals = await list(db);
  return {
    goals: goals.length,
    active: goals.filter(
      (g) => g.status === "active" || g.status === "planned" || g.status === "paused",
    ).length,
    habits: goals.flatMap((g) => g.habits).filter((h) => h.active).length,
  };
}
