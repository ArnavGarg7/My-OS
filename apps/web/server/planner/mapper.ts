import "server-only";
import type { BlockSource, PlannerBlock, PlannerDay } from "@myos/core/planner";
import type { PlannerBlockRow, PlannerDayRow } from "@myos/db/schema";

/**
 * Planner row ↔ DTO mapping (Sprint 2.6). Timestamps become ISO strings for the
 * pure engine + client. `source` is derived (not stored).
 */
function deriveSource(row: PlannerBlockRow): BlockSource {
  if (row.taskId) return "task";
  if (!row.generated) return "manual";
  return "generated";
}

export function dayRowToDay(row: PlannerDayRow): PlannerDay {
  return {
    date: row.date,
    generatedAt: row.generatedAt ? row.generatedAt.toISOString() : null,
    workingStart: row.workingStart,
    workingEnd: row.workingEnd,
    focusWindowStart: row.focusWindowStart,
    focusWindowEnd: row.focusWindowEnd,
    status: row.status,
    locked: row.locked,
  };
}

export function blockRowToBlock(row: PlannerBlockRow): PlannerBlock {
  return {
    id: row.id,
    plannerDate: row.plannerDate,
    taskId: row.taskId,
    type: row.type,
    title: row.title,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    locked: row.locked,
    generated: row.generated,
    completed: row.completed,
    source: deriveSource(row),
    createdAt: row.createdAt.toISOString(),
  };
}

export function dayToColumns(day: PlannerDay) {
  return {
    generatedAt: day.generatedAt ? new Date(day.generatedAt) : null,
    workingStart: day.workingStart,
    workingEnd: day.workingEnd,
    focusWindowStart: day.focusWindowStart,
    focusWindowEnd: day.focusWindowEnd,
    status: day.status,
    locked: day.locked,
  };
}

export function blockToColumns(block: PlannerBlock) {
  return {
    plannerDate: block.plannerDate,
    taskId: block.taskId,
    type: block.type,
    title: block.title,
    startTime: new Date(block.startTime),
    endTime: new Date(block.endTime),
    locked: block.locked,
    generated: block.generated,
    completed: block.completed,
  };
}
