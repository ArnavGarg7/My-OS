/**
 * Dynamic Replanning — Rescue My Day (Sprint 5.2). Triggered by disruptions (missed blocks,
 * cancelled events, delays, low energy, focus lost, unexpected free time). Produces a PLANNER
 * PROPOSAL that reshuffles the rest of the day around what changed — never applied until accepted.
 * Deterministic: the same disruptions + plan always yield the same rescue.
 */
import { confidenceFor } from "./confidence";
import { bestFocusWindow } from "./signals";
import type { ChiefContext, PlanChange, PlannerProposal } from "./types";

/** Build a rescue proposal from the context's disruptions. */
export function rescuePlan(ctx: ChiefContext): PlannerProposal {
  const changes: PlanChange[] = [];
  const topTask = ctx.tasks.find((t) => t.status !== "done");
  const window = bestFocusWindow(ctx);

  for (const d of ctx.disruptions) {
    switch (d.kind) {
      case "missed_block": {
        const block = ctx.planBlocks.find((b) => b.id === d.ref?.id);
        changes.push({
          kind: "move",
          ...(block ? { blockId: block.id, title: block.title } : { title: d.detail }),
          to: "tomorrow",
          reason: `You missed "${block?.title ?? d.detail}" — move it to tomorrow rather than cramming it in.`,
        });
        break;
      }
      case "cancelled_event":
      case "free_time": {
        if (topTask) {
          changes.push({
            kind: "move",
            title: `Work on "${topTask.title}"`,
            to: "now",
            reason: `${d.minutes ?? "Some"} minutes just freed up — pull your top task forward.`,
          });
        }
        break;
      }
      case "low_energy": {
        const deep = ctx.planBlocks.find((b) => b.type === "deep_work" && !b.locked);
        if (deep) {
          changes.push({
            kind: "move",
            blockId: deep.id,
            title: deep.title,
            to: "later",
            reason: "Energy is low — push deep work later and do lighter tasks now.",
          });
        }
        break;
      }
      case "delay":
      case "focus_lost":
      case "manual": {
        if (topTask && window) {
          changes.push({
            kind: "reorder",
            title: `Refocus on "${topTask.title}"`,
            reason: `Reorder the rest of the day around your remaining ${window.minutes} min.`,
          });
        }
        break;
      }
    }
  }

  return {
    kind: "rescue",
    changes,
    summary:
      changes.length === 0
        ? "No rescue needed — your plan still holds."
        : "Today's plan is no longer realistic — here's a fix.",
    rationale: "Reshuffle around what changed so the rest of the day stays achievable.",
    confidence: confidenceFor(ctx),
  };
}
