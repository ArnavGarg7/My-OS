import "server-only";
import {
  detectConflicts,
  explainBlock,
  plannerEngine,
  timeToDate,
  type BlockExplanation,
  type Conflict,
  type PlannerBlock,
  type PlannerDay,
  type PlannerInput,
  type Utilization,
} from "@myos/core/planner";
import { utilization as computeUtilization } from "@myos/core/planner";
import { planToday, selectWorkingHours, todayInTimeZone } from "@myos/core/today";
import type { Task, TaskDependency } from "@myos/core/task";
import type { Database } from "@myos/db";
import { getState } from "../today/service";
import { list as listTasks } from "../task/service";
import { meetings as calendarMeetings } from "../calendar/service";
import * as repo from "./repository";
import { blockRowToBlock, dayRowToDay } from "./mapper";

/**
 * PlannerService (Sprint 2.6). Bridges the pure PlannerEngine with persistence.
 * `generate` runs the engine over Today + Task inputs and stores the timeline;
 * locked and manual blocks survive regeneration. The engine never touches tasks.
 */
interface PlannerPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

interface Context {
  date: string;
  now: Date;
  workingHours: { start: string; end: string };
  focusWindow: { start: string; end: string };
  tasks: Task[];
  dependencies: TaskDependency[];
}

async function buildContext(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
  date: string,
): Promise<Context> {
  const now = new Date();
  const [state, tasks] = await Promise.all([getState(db, tz, date), listTasks(db, {})]);
  const workingHours = selectWorkingHours({
    state,
    preferredStartOfDay: prefs.preferredStartOfDay,
    preferredEndOfDay: prefs.preferredEndOfDay,
  });
  const snapshot = planToday({ date, now, workingHours });
  const dependencies: TaskDependency[] = tasks.flatMap((t) =>
    t.dependencies.map((dependsOnTaskId) => ({ taskId: t.id, dependsOnTaskId })),
  );
  return {
    date,
    now,
    workingHours,
    focusWindow: snapshot.productiveWindow,
    tasks,
    dependencies,
  };
}

function conflictsFor(ctx: Context, blocks: PlannerBlock[]): Conflict[] {
  return detectConflicts({
    blocks,
    tasks: ctx.tasks,
    dependencies: ctx.dependencies,
    workingStart: timeToDate(ctx.date, ctx.workingHours.start),
    workingEnd: timeToDate(ctx.date, ctx.workingHours.end),
    now: ctx.now,
  });
}

function emptyDay(ctx: Context): PlannerDay {
  return {
    date: ctx.date,
    generatedAt: null,
    workingStart: ctx.workingHours.start,
    workingEnd: ctx.workingHours.end,
    focusWindowStart: ctx.focusWindow.start,
    focusWindowEnd: ctx.focusWindow.end,
    status: "empty",
    locked: false,
  };
}

async function readPlan(
  db: Database,
  ctx: Context,
): Promise<{ day: PlannerDay; blocks: PlannerBlock[]; conflicts: Conflict[] }> {
  const dayRow = await repo.getDay(db, ctx.date);
  const blocks = (await repo.listBlocks(db, ctx.date)).map(blockRowToBlock);
  const day = dayRow ? dayRowToDay(dayRow) : emptyDay(ctx);
  return { day, blocks, conflicts: conflictsFor(ctx, blocks) };
}

/** Persist a freshly computed block set: keep locked/manual, replace generated. */
async function persistBlocks(db: Database, date: string, blocks: PlannerBlock[]): Promise<void> {
  await repo.deleteGenerated(db, date);
  for (const block of blocks) {
    if (block.generated && !block.locked) {
      await repo.insertBlock(db, { ...block, id: "" });
    }
  }
}

export async function generate(db: Database, tz: string, prefs: PlannerPrefs, date?: string) {
  const ctx = await buildContext(db, tz, prefs, date ?? todayInTimeZone(tz));
  const preserved = (await repo.listBlocks(db, ctx.date))
    .map(blockRowToBlock)
    .filter((b) => b.locked || !b.generated);

  // The Calendar owns time: today's meetings become immutable fixed blocks the
  // Planner weaves tasks around (they are not stored as canonical planner data —
  // they re-derive from the calendar on every generation).
  const meetingBlocks: PlannerBlock[] = (await calendarMeetings(db, tz, ctx.date)).map((e) => ({
    id: "",
    plannerDate: ctx.date,
    taskId: null,
    type: "meeting",
    title: e.title,
    startTime: e.startAt,
    endTime: e.endAt,
    locked: false,
    generated: true,
    completed: false,
    source: "manual",
    createdAt: ctx.now.toISOString(),
  }));
  const fixedBlocks = [...preserved, ...meetingBlocks];

  const input: PlannerInput = {
    date: ctx.date,
    now: ctx.now,
    workingHours: ctx.workingHours,
    focusWindow: ctx.focusWindow,
    tasks: ctx.tasks,
    dependencies: ctx.dependencies,
    fixedBlocks,
  };
  const result = plannerEngine.generate(input);

  await repo.upsertDay(db, result.day);
  await persistBlocks(db, ctx.date, result.blocks);
  await repo.addHistory(db, ctx.date, "generate", { blocks: result.blocks.length });

  return readPlan(db, ctx);
}

export async function get(db: Database, tz: string, prefs: PlannerPrefs, date?: string) {
  const ctx = await buildContext(db, tz, prefs, date ?? todayInTimeZone(tz));
  return readPlan(db, ctx);
}

export async function lock(db: Database, id: string): Promise<PlannerBlock> {
  const row = await repo.getBlock(db, id);
  if (!row) throw new Error("Block not found");
  return blockRowToBlock(await repo.updateBlock(db, id, plannerEngine.lock(blockRowToBlock(row))));
}

export async function unlock(db: Database, id: string): Promise<PlannerBlock> {
  const row = await repo.getBlock(db, id);
  if (!row) throw new Error("Block not found");
  return blockRowToBlock(
    await repo.updateBlock(db, id, plannerEngine.unlock(blockRowToBlock(row))),
  );
}

export async function move(
  db: Database,
  id: string,
  direction: "earlier" | "later",
  minutes?: number,
): Promise<PlannerBlock> {
  const row = await repo.getBlock(db, id);
  if (!row) throw new Error("Block not found");
  const moved = plannerEngine.move(blockRowToBlock(row), direction, minutes);
  return blockRowToBlock(await repo.updateBlock(db, id, moved));
}

export async function optimize(db: Database, tz: string, prefs: PlannerPrefs, date?: string) {
  const ctx = await buildContext(db, tz, prefs, date ?? todayInTimeZone(tz));
  const current = (await repo.listBlocks(db, ctx.date)).map(blockRowToBlock);
  const optimized = plannerEngine.optimize(
    current,
    timeToDate(ctx.date, ctx.focusWindow.start),
    timeToDate(ctx.date, ctx.focusWindow.end),
  );
  await persistBlocks(db, ctx.date, optimized);
  const dayRow = await repo.getDay(db, ctx.date);
  if (dayRow) await repo.upsertDay(db, { ...dayRowToDay(dayRow), status: "optimized" });
  await repo.addHistory(db, ctx.date, "optimize", {});
  return readPlan(db, ctx);
}

export async function clear(db: Database, tz: string, prefs: PlannerPrefs, date?: string) {
  const ctx = await buildContext(db, tz, prefs, date ?? todayInTimeZone(tz));
  await repo.deleteAllBlocks(db, ctx.date);
  await repo.upsertDay(db, { ...emptyDay(ctx), status: "empty" });
  await repo.addHistory(db, ctx.date, "clear", {});
  return readPlan(db, ctx);
}

export async function conflicts(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
  date?: string,
): Promise<Conflict[]> {
  const ctx = await buildContext(db, tz, prefs, date ?? todayInTimeZone(tz));
  const blocks = (await repo.listBlocks(db, ctx.date)).map(blockRowToBlock);
  return conflictsFor(ctx, blocks);
}

export async function explain(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
  id: string,
): Promise<BlockExplanation> {
  const row = await repo.getBlock(db, id);
  if (!row) throw new Error("Block not found");
  const ctx = await buildContext(db, tz, prefs, row.plannerDate);
  return explainBlock(blockRowToBlock(row), {
    tasks: ctx.tasks,
    dependencies: ctx.dependencies,
    focusActive: true,
  });
}

export async function history(db: Database, tz: string, date: string | undefined, limit: number) {
  const d = date ?? todayInTimeZone(tz);
  return (await repo.listHistory(db, d, limit)).map((row) => ({
    id: row.id,
    action: row.action,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Utilization summary for the status bar / context panel. */
export async function summary(
  db: Database,
  tz: string,
  prefs: PlannerPrefs,
  date?: string,
): Promise<{ day: PlannerDay; utilization: Utilization; conflicts: number }> {
  const plan = await get(db, tz, prefs, date);
  return {
    day: plan.day,
    utilization: computeUtilization(plan.day, plan.blocks),
    conflicts: plan.conflicts.length,
  };
}
