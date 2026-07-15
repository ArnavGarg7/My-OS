import "server-only";
import {
  summarizePreview,
  type PlannerPreview,
  type PlannerPreviewBlock,
} from "@myos/core/tomorrow";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import * as plannerService from "../planner/service";

/**
 * Tomorrow planner preview (Sprint 3.1). Uses the existing Planner engine to
 * draft tomorrow's timeline — preview only. The Planner remains canonical: this
 * generates the plan for the TARGET date (never today), so it never overwrites
 * today's plan. Accept keeps it, Regenerate re-runs it, Discard clears it.
 */
interface PlannerPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

const DAY_MS = 86_400_000;

function tomorrowDate(tz: string): string {
  return new Date(new Date(`${todayInTimeZone(tz)}T00:00:00Z`).getTime() + DAY_MS)
    .toISOString()
    .slice(0, 10);
}

interface PlanBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  locked: boolean;
}

function toPreviewBlocks(blocks: PlanBlock[]): PlannerPreviewBlock[] {
  return blocks.map((b) => ({
    id: b.id,
    title: b.title,
    start: b.startTime,
    end: b.endTime,
    kind: b.type,
    minutes: Math.max(
      0,
      Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000),
    ),
    locked: b.locked,
  }));
}

/** Generate (draft) tomorrow's plan and summarise it as a preview. */
export async function preview(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
): Promise<PlannerPreview> {
  const date = tomorrowDate(tz);
  const plan = (await plannerService.generate(db, tz, prefs, date)) as { blocks: PlanBlock[] };
  return summarizePreview(date, toPreviewBlocks(plan.blocks ?? []), "draft");
}

/** Read the current (already-drafted) preview without regenerating. */
export async function currentPreview(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
): Promise<PlannerPreview> {
  const date = tomorrowDate(tz);
  const plan = (await plannerService.get(db, tz, prefs, date)) as { blocks: PlanBlock[] };
  return summarizePreview(
    date,
    toPreviewBlocks(plan.blocks ?? []),
    plan.blocks?.length ? "accepted" : "draft",
  );
}

/** Discard tomorrow's draft (clears the generated blocks for the target date). */
export async function discard(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
): Promise<PlannerPreview> {
  const date = tomorrowDate(tz);
  await plannerService.clear(db, tz, prefs, date).catch(() => undefined);
  return summarizePreview(date, [], "discarded");
}
