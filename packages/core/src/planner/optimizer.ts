import { BUFFER_MINUTES, MIN_GAP_MERGE_MINUTES } from "./constants";
import { bufferBlock } from "./blockers";
import { ms, sortBlocks } from "./timeline";
import type { PlannerBlock } from "./types";

/**
 * Optimization engine (Sprint 2.6). Pure, deterministic rules: merge tiny gaps,
 * protect focus blocks, reserve buffers after meetings. Locked and overflow
 * blocks are never moved.
 */

/** Pull unlocked blocks earlier to close gaps smaller than the merge threshold. */
export function mergeTinyGaps(blocks: PlannerBlock[]): PlannerBlock[] {
  const sorted = sortBlocks(blocks);
  const thresholdMs = MIN_GAP_MERGE_MINUTES * 60_000;
  let prevEnd: number | null = null;
  return sorted.map((block) => {
    if (block.type === "overflow" || prevEnd === null) {
      prevEnd = ms(block.endTime);
      return block;
    }
    const start = ms(block.startTime);
    const gap = start - prevEnd;
    if (!block.locked && gap > 0 && gap < thresholdMs) {
      const duration = ms(block.endTime) - start;
      const newStart = prevEnd;
      const shifted: PlannerBlock = {
        ...block,
        startTime: new Date(newStart).toISOString(),
        endTime: new Date(newStart + duration).toISOString(),
      };
      prevEnd = newStart + duration;
      return shifted;
    }
    prevEnd = Math.max(prevEnd, ms(block.endTime));
    return block;
  });
}

/** Mark task blocks fully inside the focus window as `focus`. */
export function markFocusBlocks(
  blocks: PlannerBlock[],
  focusStart: Date | null,
  focusEnd: Date | null,
): PlannerBlock[] {
  if (!focusStart || !focusEnd) return blocks;
  const fs = focusStart.getTime();
  const fe = focusEnd.getTime();
  return blocks.map((block) => {
    if (block.type !== "task") return block;
    if (ms(block.startTime) >= fs && ms(block.endTime) <= fe) {
      return { ...block, type: "focus" };
    }
    return block;
  });
}

/** Insert a buffer after each meeting that has a following gap. */
export function reserveBuffers(blocks: PlannerBlock[]): PlannerBlock[] {
  const sorted = sortBlocks(blocks);
  const out: PlannerBlock[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const block = sorted[i]!;
    out.push(block);
    if (block.type !== "meeting") continue;
    const next = sorted[i + 1];
    const gapMs = next ? ms(next.startTime) - ms(block.endTime) : Infinity;
    if (gapMs >= BUFFER_MINUTES * 60_000) {
      out.push(bufferBlock(block.plannerDate, new Date(ms(block.endTime)), BUFFER_MINUTES));
    }
  }
  return sortBlocks(out);
}

export function optimizeTimeline(
  blocks: PlannerBlock[],
  focusStart: Date | null,
  focusEnd: Date | null,
): PlannerBlock[] {
  return reserveBuffers(markFocusBlocks(mergeTinyGaps(blocks), focusStart, focusEnd));
}
