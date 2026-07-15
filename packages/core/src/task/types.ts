import type { RecurrenceFrequency, TaskLabelColor, TaskPriority, TaskStatus } from "./constants";

/**
 * Task domain types (Sprint 2.5). A Task is the canonical unit of work. Pure
 * domain object — timestamps are ISO strings so the engine never touches Date
 * columns. Relations (labels, dependencies) are hydrated onto the DTO.
 */
export interface Task {
  /** Persistence id; "" for a not-yet-persisted draft. */
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  dueAt: string | null; // ISO
  scheduledStart: string | null; // ISO
  scheduledEnd: string | null; // ISO
  completedAt: string | null; // ISO
  parentTaskId: string | null;
  /** Project hierarchy ownership (Sprint 2.8) — all optional. */
  projectId: string | null;
  milestoneId: string | null;
  objectiveId: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** Hydrated relations (default []). */
  labels: TaskLabel[];
  dependencies: string[]; // task ids this task depends on
}

export interface TaskLabel {
  id: string;
  name: string;
  color: TaskLabelColor;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // every N periods
}

export interface RecurringTask {
  taskId: string;
  rule: RecurrenceRule;
  nextOccurrence: string | null; // ISO
}

/** What the engine needs to create a task. */
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number | null;
  dueAt?: string | null;
  parentTaskId?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
  objectiveId?: string | null;
}

/** Deterministic parser output — a task-shaped draft plus extracted hints. */
export interface TaskDraft {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedMinutes: number | null;
  dueAt: string | null;
  recurrence: RecurrenceRule | null;
  urls: string[];
}

/** Derived progress — never stored redundantly. */
export interface TaskProgress {
  status: TaskStatus;
  completionPercent: number; // 0–100
  remainingMinutes: number | null;
  isLate: boolean;
  isBlocked: boolean;
  blockedBy: string[];
}

/** Deterministic scheduling recommendation. */
export interface ScheduleResult {
  recommendedStart: string | null; // ISO
  recommendedEnd: string | null; // ISO
  overflow: boolean;
  remainingWork: number; // minutes that didn't fit today
}

export interface DependencyEdge {
  from: string; // depends on
  to: string; // dependent
}

export type TaskSort = "priority" | "due" | "created" | "title";

export interface TaskFilter {
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  labelId?: string | undefined;
}
