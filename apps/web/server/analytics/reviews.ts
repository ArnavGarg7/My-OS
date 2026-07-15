import "server-only";
import { analyticsEngine, type Review } from "@myos/core/analytics";
import type { Database } from "@myos/db";
import { buildContext } from "./service";

/**
 * Analytics review service (Sprint 2.14). Builds a deterministic period review
 * (weekly/monthly/quarterly/yearly) from the analytics context. Reviews are
 * generated on demand — persistence lives in `reports`.
 */
export async function weeklyReview(db: Database, tz: string): Promise<Review> {
  return analyticsEngine.review(await buildContext(db, tz), "weekly");
}
export async function monthlyReview(db: Database, tz: string): Promise<Review> {
  return analyticsEngine.review(await buildContext(db, tz), "monthly");
}
export async function quarterlyReview(db: Database, tz: string): Promise<Review> {
  return analyticsEngine.review(await buildContext(db, tz), "quarterly");
}
export async function yearlyReview(db: Database, tz: string): Promise<Review> {
  return analyticsEngine.review(await buildContext(db, tz), "yearly");
}
