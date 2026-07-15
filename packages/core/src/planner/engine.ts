import { MOVE_STEP_MINUTES } from "./constants";
import { orderTasks, removeCompleted } from "./scheduler";
import { allocateTasks } from "./allocator";
import { lunchBreak, timeToDate } from "./blockers";
import { optimizeTimeline } from "./optimizer";
import { detectConflicts } from "./conflict";
import { ms, overlaps } from "./timeline";
import type { PlannerBlock, PlannerDay, PlannerInput, PlannerResult } from "./types";

/**
 * PlannerEngine (Sprint 2.6). Pure, deterministic orchestration. `generate` runs
 * the fixed pipeline (collect → remove completed → resolve dependencies → sort →
 * allocate → optimize → detect conflicts). Locked blocks are preserved across
 * regenerations. The engine never mutates task data.
 */
export class PlannerEngine {
  generate(input: PlannerInput): PlannerResult {
    const workingStart = timeToDate(input.date, input.workingHours.start);
    const workingEnd = timeToDate(input.date, input.workingHours.end);
    const focusStart = input.focusWindow ? timeToDate(input.date, input.focusWindow.start) : null;
    const focusEnd = input.focusWindow ? timeToDate(input.date, input.focusWindow.end) : null;

    // Fixed blocks carried in (locked + manual meetings/breaks).
    const fixed = [...input.fixedBlocks];

    // Seed a lunch break if the window allows and nothing already occupies it.
    const lunch = lunchBreak(input.date, input.workingHours.start, input.workingHours.end);
    if (lunch && !fixed.some((b) => overlaps(b, lunch))) fixed.push(lunch);

    // Tasks already pinned by a locked block are not re-allocated.
    const lockedTaskIds = new Set(fixed.filter((b) => b.locked && b.taskId).map((b) => b.taskId!));
    const open = removeCompleted(input.tasks).filter((t) => !lockedTaskIds.has(t.id));

    const ordered = orderTasks(open, input.dependencies);
    const nowIso = input.now.toISOString();
    const allocated = allocateTasks(ordered, {
      date: input.date,
      now: input.now,
      workingStart,
      workingEnd,
      fixedBlocks: fixed,
      nowIso,
    });

    const combined = [...fixed, ...allocated];
    const optimized = optimizeTimeline(combined, focusStart, focusEnd);

    const conflicts = detectConflicts({
      blocks: optimized,
      tasks: input.tasks,
      dependencies: input.dependencies,
      workingStart,
      workingEnd,
      now: input.now,
    });

    const day: PlannerDay = {
      date: input.date,
      generatedAt: nowIso,
      workingStart: input.workingHours.start,
      workingEnd: input.workingHours.end,
      focusWindowStart: input.focusWindow?.start ?? null,
      focusWindowEnd: input.focusWindow?.end ?? null,
      status: "generated",
      locked: false,
    };

    return { day, blocks: optimized, conflicts };
  }

  lock(block: PlannerBlock): PlannerBlock {
    return { ...block, locked: true };
  }

  unlock(block: PlannerBlock): PlannerBlock {
    return { ...block, locked: false };
  }

  /** Nudge a block earlier/later by a fixed step (or a custom minute delta). */
  move(
    block: PlannerBlock,
    direction: "earlier" | "later",
    minutes = MOVE_STEP_MINUTES,
  ): PlannerBlock {
    const delta = (direction === "earlier" ? -1 : 1) * minutes * 60_000;
    return {
      ...block,
      startTime: new Date(ms(block.startTime) + delta).toISOString(),
      endTime: new Date(ms(block.endTime) + delta).toISOString(),
    };
  }

  optimize(blocks: PlannerBlock[], focusStart: Date | null, focusEnd: Date | null): PlannerBlock[] {
    return optimizeTimeline(blocks, focusStart, focusEnd);
  }
}

export const plannerEngine = new PlannerEngine();
