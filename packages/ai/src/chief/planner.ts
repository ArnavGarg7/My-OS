/**
 * Optimize My Day (Sprint 5.2). Produces a PLANNER PROPOSAL — moved/added/reordered blocks and
 * inserted breaks — that the user accepts before anything changes. It NEVER edits the live plan;
 * the proposal is a pure diff. Locked blocks are untouchable. Deterministic: the same plan always
 * yields the same proposal, so the user can trust it.
 */
import { confidenceFor } from "./confidence";
import { minutesBetween } from "./signals";
import type { ChiefContext, PlanChange, PlannerProposal } from "./types";

/**
 * Optimize the day: insert breaks after over-long blocks and pull the highest-value work into the
 * earliest uninterrupted window. Returns a proposal (never applied).
 */
export function optimizePlan(ctx: ChiefContext): PlannerProposal {
  const changes: PlanChange[] = [];
  const breakEvery = ctx.profile.breakFrequencyMinutes;

  // 1. Insert breaks after work blocks longer than the break cadence.
  for (const block of ctx.planBlocks) {
    if (block.locked) continue;
    if (block.type === "break") continue;
    const length = minutesBetween(block.start, block.end);
    if (length > breakEvery + 15) {
      changes.push({
        kind: "break",
        blockId: block.id,
        title: `Break after "${block.title}"`,
        reason: `"${block.title}" runs ${length} min — longer than your ${breakEvery}-min break cadence.`,
      });
    }
  }

  // 2. Pull the top task's block into the earliest uninterrupted window, if it's scheduled later.
  const uninterrupted = [...ctx.focusWindows]
    .filter((w) => w.uninterrupted)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const topTask = ctx.tasks.find((t) => t.status !== "done");
  const earliest = uninterrupted[0];
  if (topTask && earliest) {
    const block = ctx.planBlocks.find((b) => b.taskId === topTask.id && !b.locked);
    if (block && new Date(block.start).getTime() > new Date(earliest.start).getTime()) {
      changes.push({
        kind: "move",
        blockId: block.id,
        title: block.title,
        from: block.start,
        to: earliest.start,
        reason: `Move your top task into the earliest uninterrupted window (${earliest.minutes} min).`,
      });
    }
  }

  return {
    kind: "optimize",
    changes,
    summary:
      changes.length === 0
        ? "Your day is already well-optimized."
        : `${changes.length} improvement${changes.length === 1 ? "" : "s"} proposed.`,
    rationale: "Protect focus with breaks and align your highest-value work with your best window.",
    confidence: confidenceFor(ctx),
  };
}
