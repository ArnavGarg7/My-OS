import type { WorkingHours } from "../today";
import { nextOccurrence } from "./recurrence";
import { scheduleTask } from "./scheduling";
import { calculateProgress } from "./progress";
import type {
  CreateTaskInput,
  RecurrenceRule,
  ScheduleResult,
  Task,
  TaskDependency,
  TaskProgress,
} from "./types";

/**
 * TaskEngine (Sprint 2.5). Pure, deterministic operations over Tasks. The engine
 * never persists and never mutates in place — every transition returns the next
 * immutable Task. Scheduling + progress delegate to their focused modules.
 */
export class TaskEngine {
  /** Build a not-yet-persisted task from validated input. */
  create(input: CreateTaskInput, now: Date): Task {
    const iso = now.toISOString();
    return {
      id: "",
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      status: "not_started",
      priority: input.priority ?? "medium",
      estimatedMinutes: input.estimatedMinutes ?? null,
      actualMinutes: null,
      dueAt: input.dueAt ?? null,
      scheduledStart: null,
      scheduledEnd: null,
      completedAt: null,
      parentTaskId: input.parentTaskId ?? null,
      projectId: input.projectId ?? null,
      milestoneId: input.milestoneId ?? null,
      objectiveId: input.objectiveId ?? null,
      createdAt: iso,
      updatedAt: iso,
      labels: [],
      dependencies: [],
    };
  }

  /** Structural validation — returns the list of problems (empty = valid). */
  validate(task: Task): string[] {
    const errors: string[] = [];
    if (!task.title.trim()) errors.push("Title is required.");
    if (task.estimatedMinutes !== null && task.estimatedMinutes < 0)
      errors.push("Estimate cannot be negative.");
    if (
      task.scheduledStart &&
      task.scheduledEnd &&
      new Date(task.scheduledEnd).getTime() <= new Date(task.scheduledStart).getTime()
    )
      errors.push("Scheduled end must be after start.");
    return errors;
  }

  private touch(task: Task, now: Date): Task {
    return { ...task, updatedAt: now.toISOString() };
  }

  start(task: Task, now: Date): Task {
    return this.touch({ ...task, status: "in_progress" }, now);
  }

  block(task: Task, now: Date): Task {
    return this.touch({ ...task, status: "blocked" }, now);
  }

  unblock(task: Task, now: Date): Task {
    return this.touch({ ...task, status: "in_progress" }, now);
  }

  complete(task: Task, now: Date): Task {
    return this.touch({ ...task, status: "completed", completedAt: now.toISOString() }, now);
  }

  archive(task: Task, now: Date): Task {
    return this.touch({ ...task, status: "archived" }, now);
  }

  update(task: Task, patch: Partial<CreateTaskInput>, now: Date): Task {
    return this.touch(
      {
        ...task,
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.estimatedMinutes !== undefined
          ? { estimatedMinutes: patch.estimatedMinutes }
          : {}),
        ...(patch.dueAt !== undefined ? { dueAt: patch.dueAt } : {}),
      },
      now,
    );
  }

  /** Compute a recommended slot and apply it to the task. */
  schedule(input: { task: Task; workingHours: WorkingHours; existing: Task[]; now: Date }): {
    task: Task;
    result: ScheduleResult;
  } {
    const result = scheduleTask(input);
    const task =
      result.recommendedStart && result.recommendedEnd
        ? this.touch(
            {
              ...input.task,
              scheduledStart: result.recommendedStart,
              scheduledEnd: result.recommendedEnd,
            },
            input.now,
          )
        : input.task;
    return { task, result };
  }

  progress(task: Task, deps: TaskDependency[], allTasks: Task[], now: Date): TaskProgress {
    return calculateProgress(task, deps, allTasks, now);
  }

  /** Generate the next recurring instance from a completed task (unpersisted). */
  generateNextOccurrence(task: Task, rule: RecurrenceRule, now: Date): Task {
    const base = task.dueAt ? new Date(task.dueAt) : now;
    const nextDue = nextOccurrence(rule, base);
    const fresh = this.create(
      {
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        dueAt: nextDue.toISOString(),
        parentTaskId: task.parentTaskId,
      },
      now,
    );
    return fresh;
  }
}

/** Shared singleton — the engine is stateless. */
export const taskEngine = new TaskEngine();
