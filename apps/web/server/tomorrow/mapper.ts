import "server-only";
import type { TomorrowPlan } from "@myos/core/tomorrow";
import type { TomorrowPlanRow, TomorrowPriorityRow } from "@myos/db/schema";

/**
 * Tomorrow row ↔ DTO mapping (Sprint 3.1). Timestamps become ISO strings for the
 * pure engine + client.
 */
export function planRowToPlan(row: TomorrowPlanRow): TomorrowPlan {
  return {
    id: row.id,
    planningDate: row.planningDate,
    targetDate: row.targetDate,
    status: row.status,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface SavedPriority {
  id: string;
  order: number;
  title: string;
  taskId: string | null;
  projectId: string | null;
  goalId: string | null;
}

export function priorityRowToDTO(row: TomorrowPriorityRow): SavedPriority {
  return {
    id: row.id,
    order: row.priorityOrder,
    title: row.title,
    taskId: row.taskId,
    projectId: row.projectId,
    goalId: row.goalId,
  };
}
