import "server-only";
import {
  addDependency as coreAddDependency,
  nextOccurrence,
  parseTask,
  searchTasks,
  selectScheduled,
  taskCounts,
  taskEngine,
  type RecurrenceFrequency,
  type ScheduleResult,
  type Task,
  type TaskLabel,
  type CreateTaskSchemaInput,
  type ListTasksInput,
  type UpdateTaskSchemaInput,
} from "@myos/core/task";
import { selectWorkingHours, todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { getState } from "../today/service";
import * as inboxRepo from "../inbox/repository";
import { rowToItem } from "../inbox/mapper";
import { inboxEngine } from "@myos/core/inbox";
import * as repo from "./repository";
import { labelRowToLabel, rowToTask } from "./mapper";
import type { TaskRow } from "@myos/db/schema";

/**
 * TaskService (Sprint 2.5). Bridges the pure TaskEngine with persistence and
 * hydrates relations (labels + dependencies). Scheduling reuses the Today
 * working-hours; recurrence generates the next instance on completion.
 */
interface TaskPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

async function hydrate(db: Database, rows: TaskRow[]): Promise<Task[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [labelMap, deps] = await Promise.all([
    repo.labelsForTasks(db, ids),
    repo.listDependencies(db),
  ]);
  return rows.map((r) =>
    rowToTask(
      r,
      (labelMap.get(r.id) ?? []).map(labelRowToLabel),
      deps.filter((d) => d.taskId === r.id).map((d) => d.dependsOnTaskId),
    ),
  );
}

async function hydrateOne(db: Database, row: TaskRow): Promise<Task> {
  return (await hydrate(db, [row]))[0]!;
}

export async function list(db: Database, input: ListTasksInput): Promise<Task[]> {
  const rows = await repo.list(db, input);
  const hydrated = await hydrate(db, rows);
  return input.labelId
    ? hydrated.filter((t) => t.labels.some((l) => l.id === input.labelId))
    : hydrated;
}

export async function get(db: Database, id: string): Promise<Task> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Task not found");
  return hydrateOne(db, row);
}

export async function create(db: Database, input: CreateTaskSchemaInput): Promise<Task> {
  const task = taskEngine.create(
    {
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
      ...(input.parentTaskId !== undefined ? { parentTaskId: input.parentTaskId } : {}),
    },
    new Date(),
  );
  const errors = taskEngine.validate(task);
  if (errors.length) throw new Error(errors.join(" "));
  return hydrateOne(db, await repo.insert(db, task));
}

export async function update(db: Database, input: UpdateTaskSchemaInput): Promise<Task> {
  const row = await repo.getById(db, input.id);
  if (!row) throw new Error("Task not found");
  const now = new Date();
  const current = rowToTask(row);

  const statusPatch =
    input.status !== undefined
      ? {
          status: input.status,
          completedAt:
            input.status === "completed"
              ? (current.completedAt ?? now.toISOString())
              : input.status !== current.status
                ? null
                : current.completedAt,
        }
      : {};

  const updated: Task = {
    ...current,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
    ...(input.actualMinutes !== undefined ? { actualMinutes: input.actualMinutes } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...statusPatch,
    updatedAt: now.toISOString(),
  };
  return hydrateOne(db, await repo.update(db, input.id, updated));
}

export async function complete(db: Database, id: string): Promise<Task> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Task not found");
  const now = new Date();
  const done = taskEngine.complete(rowToTask(row), now);
  const savedRow = await repo.update(db, id, done);

  // Recurrence: generate the next occurrence on completion (no background job).
  const rec = await repo.getRecurrence(db, id);
  if (rec) {
    const next = taskEngine.generateNextOccurrence(
      rowToTask(savedRow),
      { frequency: rec.frequency, interval: rec.interval },
      now,
    );
    const nextRow = await repo.insert(db, next);
    await repo.upsertRecurrence(db, {
      taskId: rec.taskId,
      frequency: rec.frequency,
      interval: rec.interval,
      nextOccurrence: nextRow.dueAt,
    });
  }
  return hydrateOne(db, savedRow);
}

export async function archive(db: Database, id: string): Promise<Task> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Task not found");
  return hydrateOne(db, await repo.update(db, id, taskEngine.archive(rowToTask(row), new Date())));
}

export async function remove(db: Database, id: string): Promise<{ id: string }> {
  await repo.remove(db, id);
  return { id };
}

export async function schedule(
  db: Database,
  tz: string,
  prefs: TaskPrefs,
  id: string,
): Promise<{ task: Task; result: ScheduleResult }> {
  const row = await repo.getById(db, id);
  if (!row) throw new Error("Task not found");
  const date = todayInTimeZone(tz);
  const state = await getState(db, tz, date);
  const workingHours = selectWorkingHours({
    state,
    preferredStartOfDay: prefs.preferredStartOfDay,
    preferredEndOfDay: prefs.preferredEndOfDay,
  });
  const allRows = await repo.list(db, {});
  const existing = (await hydrate(db, allRows)).filter((t) => t.id !== id);

  const { task, result } = taskEngine.schedule({
    task: rowToTask(row),
    workingHours,
    existing: selectScheduled(existing),
    now: new Date(),
  });
  const saved = result.recommendedStart ? await repo.update(db, id, task) : row;
  return { task: await hydrateOne(db, saved), result };
}

export async function addDependency(
  db: Database,
  taskId: string,
  dependsOnTaskId: string,
): Promise<Task> {
  const deps = await repo.listDependencies(db);
  const result = coreAddDependency(deps, taskId, dependsOnTaskId);
  if (!result.ok) throw new Error(`Cannot add dependency: ${result.error}`);
  await repo.addDependency(db, taskId, dependsOnTaskId);
  return get(db, taskId);
}

export async function removeDependency(
  db: Database,
  taskId: string,
  dependsOnTaskId: string,
): Promise<Task> {
  await repo.removeDependency(db, taskId, dependsOnTaskId);
  return get(db, taskId);
}

export async function convertInbox(
  db: Database,
  input: {
    inboxId: string;
    title?: string | undefined;
    description?: string | undefined;
    priority?: CreateTaskSchemaInput["priority"];
    estimatedMinutes?: number | null | undefined;
    dueAt?: string | null | undefined;
  },
): Promise<Task> {
  const itemRow = await inboxRepo.getById(db, input.inboxId);
  if (!itemRow) throw new Error("Inbox item not found");
  const now = new Date();
  const draft = parseTask(itemRow.content || itemRow.title, now);

  const task = taskEngine.create(
    {
      title: input.title ?? draft.title,
      description: input.description ?? draft.description,
      priority: input.priority ?? draft.priority,
      estimatedMinutes:
        input.estimatedMinutes !== undefined ? input.estimatedMinutes : draft.estimatedMinutes,
      dueAt: input.dueAt !== undefined ? input.dueAt : draft.dueAt,
    },
    now,
  );
  const savedRow = await repo.insert(db, task);

  // Mark the inbox item organized and link it to the new task (one-way).
  const item = inboxEngine.organize(rowToItem(itemRow), "General Notes", now);
  await inboxRepo.update(db, input.inboxId, {
    ...item,
    metadata: { ...item.metadata, organizedToTaskId: savedRow.id },
  });

  return hydrateOne(db, savedRow);
}

export async function search(db: Database, text: string): Promise<Task[]> {
  const all = await hydrate(db, await repo.list(db, {}));
  return searchTasks(all, text);
}

export async function labels(db: Database): Promise<TaskLabel[]> {
  return (await repo.listLabels(db)).map(labelRowToLabel);
}

export async function createLabel(
  db: Database,
  input: { name: string; color: string },
): Promise<TaskLabel> {
  return labelRowToLabel(await repo.createLabel(db, input));
}

export async function setRecurrence(
  db: Database,
  input: { taskId: string; frequency: RecurrenceFrequency; interval: number },
): Promise<{ nextOccurrence: string | null }> {
  const row = await repo.getById(db, input.taskId);
  if (!row) throw new Error("Task not found");
  const base = row.dueAt ?? new Date();
  const next = nextOccurrence({ frequency: input.frequency, interval: input.interval }, base);
  const rec = await repo.upsertRecurrence(db, {
    taskId: input.taskId,
    frequency: input.frequency,
    interval: input.interval,
    nextOccurrence: next,
  });
  return { nextOccurrence: rec.nextOccurrence ? rec.nextOccurrence.toISOString() : null };
}

/** Summary counts for the status bar. */
export async function counts(db: Database): Promise<{
  open: number;
  scheduled: number;
  overdue: number;
  completed: number;
}> {
  const all = await hydrate(db, await repo.list(db, {}));
  return taskCounts(all, new Date());
}
