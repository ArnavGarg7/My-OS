import "server-only";
import type { FocusBreakRow, FocusInterruptionRow, FocusSessionRow } from "@myos/db/schema";
import type { FocusBreak, FocusSession, Interruption } from "@myos/core/focus";

/**
 * Focus mappers (Sprint 3.2). Convert persisted rows into the pure domain
 * FocusSession the core engine operates on. Timer/metric values are NEVER stored —
 * they derive from these timestamps at read time.
 */
function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export function interruptionRowToDomain(row: FocusInterruptionRow): Interruption {
  return {
    id: row.id,
    type: row.type,
    at: row.at.toISOString(),
    ...(row.note ? { note: row.note } : {}),
  };
}

export function breakRowToDomain(row: FocusBreakRow): FocusBreak {
  return {
    id: row.id,
    type: row.type,
    startedAt: row.startedAt.toISOString(),
    endedAt: iso(row.endedAt),
    plannedMinutes: row.plannedMinutes,
  };
}

export function sessionRowToDomain(
  row: FocusSessionRow,
  interruptions: FocusInterruptionRow[],
  breaks: FocusBreakRow[],
): FocusSession {
  return {
    id: row.id,
    taskId: row.taskId,
    plannerBlockId: row.plannerBlockId,
    projectId: row.projectId,
    type: row.type,
    status: row.status,
    startedAt: iso(row.startedAt),
    endedAt: iso(row.endedAt),
    pausedDurationMs: row.pausedDurationMs,
    pausedAt: iso(row.pausedAt),
    plannedMinutes: row.plannedMinutes,
    interruptions: interruptions.map(interruptionRowToDomain),
    breaks: breaks.map(breakRowToDomain),
    notes: row.notes,
    completed: row.completed,
    energyBefore: row.energyBefore,
    energyAfter: row.energyAfter,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Convert a domain session into the persistable column set (mutable fields only). */
export function sessionToColumns(session: FocusSession, sessionDate: string) {
  return {
    taskId: session.taskId,
    plannerBlockId: session.plannerBlockId,
    projectId: session.projectId,
    type: session.type,
    status: session.status,
    startedAt: session.startedAt ? new Date(session.startedAt) : null,
    endedAt: session.endedAt ? new Date(session.endedAt) : null,
    pausedDurationMs: session.pausedDurationMs,
    pausedAt: session.pausedAt ? new Date(session.pausedAt) : null,
    plannedMinutes: session.plannedMinutes,
    notes: session.notes,
    completed: session.completed,
    energyBefore: session.energyBefore,
    energyAfter: session.energyAfter,
    sessionDate,
    updatedAt: new Date(),
  };
}
