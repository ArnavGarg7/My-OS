import type { WorkingHours } from "../today";
import type { Task, TaskDependency } from "../task";
import type { BlockSource, ConflictType, PlannerBlockType, PlannerStatus } from "./constants";

/**
 * Planner domain types (Sprint 2.6). A timeline is an ordered set of immutable
 * blocks. The Planner never mutates task data — it only arranges time.
 */
export interface PlannerBlock {
  /** Persistence id; "" for a not-yet-persisted block. */
  id: string;
  plannerDate: string; // YYYY-MM-DD
  taskId: string | null;
  type: PlannerBlockType;
  title: string;
  startTime: string; // ISO
  endTime: string; // ISO
  locked: boolean;
  generated: boolean;
  completed: boolean;
  /** Derived, not stored — task | decision | manual | generated. */
  source: BlockSource;
  createdAt: string; // ISO
}

export interface PlannerDay {
  date: string; // YYYY-MM-DD
  generatedAt: string | null; // ISO
  workingStart: string; // HH:MM
  workingEnd: string; // HH:MM
  focusWindowStart: string | null; // HH:MM
  focusWindowEnd: string | null; // HH:MM
  status: PlannerStatus;
  locked: boolean;
}

export interface Conflict {
  type: ConflictType;
  message: string;
  blockIds: string[];
  taskIds: string[];
}

/** Everything the engine needs to generate a plan. */
export interface PlannerInput {
  date: string;
  now: Date;
  workingHours: WorkingHours;
  focusWindow: { start: string; end: string } | null;
  tasks: Task[];
  dependencies: TaskDependency[];
  /** Blocks kept across regenerations (locked) + manual meetings/breaks. */
  fixedBlocks: PlannerBlock[];
}

export interface PlannerResult {
  day: PlannerDay;
  blocks: PlannerBlock[];
  conflicts: Conflict[];
}

export interface BlockExplanation {
  blockId: string;
  title: string;
  reasons: string[];
}

export interface Utilization {
  scheduledMinutes: number;
  workingMinutes: number;
  freeMinutes: number;
  percentUtilized: number; // 0–100
}
