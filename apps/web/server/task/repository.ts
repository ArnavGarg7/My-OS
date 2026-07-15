import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  recurringTasks,
  taskDependencies,
  taskLabelMap,
  taskLabels,
  tasks,
  type RecurringTaskRow,
  type TaskLabelRow,
  type TaskRow,
} from "@myos/db/schema";
import type { RecurrenceFrequency, Task, TaskPriority, TaskStatus } from "@myos/core/task";
import { taskToColumns } from "./mapper";

/**
 * Task persistence (Sprint 2.5). Pure DB access over the five task tables. No
 * business logic — the service composes these with the pure TaskEngine.
 */
export async function list(
  db: Database,
  filter: {
    status?: TaskStatus | undefined;
    priority?: TaskPriority | undefined;
    limit?: number | undefined;
  },
): Promise<TaskRow[]> {
  const conditions = [];
  if (filter.status) conditions.push(eq(tasks.status, filter.status));
  if (filter.priority) conditions.push(eq(tasks.priority, filter.priority));
  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.createdAt))
    .limit(filter.limit ?? 500);
}

export async function getById(db: Database, id: string): Promise<TaskRow | undefined> {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row;
}

export async function insert(db: Database, task: Task): Promise<TaskRow> {
  const [row] = await db.insert(tasks).values(taskToColumns(task)).returning();
  if (!row) throw new Error("Failed to insert task");
  return row;
}

export async function update(db: Database, id: string, task: Task): Promise<TaskRow> {
  const [row] = await db.update(tasks).set(taskToColumns(task)).where(eq(tasks.id, id)).returning();
  if (!row) throw new Error("Failed to update task");
  return row;
}

export async function remove(db: Database, id: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}

// --- dependencies ---
export async function listDependencies(
  db: Database,
): Promise<{ taskId: string; dependsOnTaskId: string }[]> {
  return db.select().from(taskDependencies);
}

export async function addDependency(
  db: Database,
  taskId: string,
  dependsOnTaskId: string,
): Promise<void> {
  await db.insert(taskDependencies).values({ taskId, dependsOnTaskId }).onConflictDoNothing();
}

export async function removeDependency(
  db: Database,
  taskId: string,
  dependsOnTaskId: string,
): Promise<void> {
  await db
    .delete(taskDependencies)
    .where(
      and(
        eq(taskDependencies.taskId, taskId),
        eq(taskDependencies.dependsOnTaskId, dependsOnTaskId),
      ),
    );
}

// --- labels ---
export async function listLabels(db: Database): Promise<TaskLabelRow[]> {
  return db.select().from(taskLabels).orderBy(taskLabels.name);
}

export async function createLabel(
  db: Database,
  input: { name: string; color: string },
): Promise<TaskLabelRow> {
  const [row] = await db.insert(taskLabels).values(input).returning();
  if (!row) throw new Error("Failed to create label");
  return row;
}

/** Label rows keyed by task id (for hydration). */
export async function labelsForTasks(
  db: Database,
  taskIds: string[],
): Promise<Map<string, TaskLabelRow[]>> {
  const map = new Map<string, TaskLabelRow[]>();
  if (taskIds.length === 0) return map;
  const rows = await db
    .select({
      taskId: taskLabelMap.taskId,
      id: taskLabels.id,
      name: taskLabels.name,
      color: taskLabels.color,
    })
    .from(taskLabelMap)
    .innerJoin(taskLabels, eq(taskLabelMap.labelId, taskLabels.id))
    .where(inArray(taskLabelMap.taskId, taskIds));
  for (const r of rows) {
    const list = map.get(r.taskId) ?? [];
    list.push({ id: r.id, name: r.name, color: r.color });
    map.set(r.taskId, list);
  }
  return map;
}

// --- recurrence ---
export async function getRecurrence(
  db: Database,
  taskId: string,
): Promise<RecurringTaskRow | undefined> {
  const [row] = await db
    .select()
    .from(recurringTasks)
    .where(eq(recurringTasks.taskId, taskId))
    .limit(1);
  return row;
}

export async function upsertRecurrence(
  db: Database,
  input: {
    taskId: string;
    frequency: RecurrenceFrequency;
    interval: number;
    nextOccurrence: Date | null;
  },
): Promise<RecurringTaskRow> {
  const [row] = await db
    .insert(recurringTasks)
    .values(input)
    .onConflictDoUpdate({
      target: recurringTasks.taskId,
      set: {
        frequency: input.frequency,
        interval: input.interval,
        nextOccurrence: input.nextOccurrence,
      },
    })
    .returning();
  if (!row) throw new Error("Failed to upsert recurrence");
  return row;
}
